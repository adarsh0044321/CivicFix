package com.civicfix.service;

import com.civicfix.dto.PriorityBreakdownDto;
import com.civicfix.entity.Complaint;
import com.civicfix.model.enums.ComplaintCategory;
import com.civicfix.model.enums.UrgencyLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;

/**
 * PriorityCalculationService - Phase 10
 *
 * Implements the mandated PS-09 transparent 15-point priority scoring formula:
 * Total Score = Severity (0-5) + Public Safety (0-4) + People Affected (0-3) + Duration (0-2) + Confirmations (0-1)
 *
 * Enforces dynamic SLA targets:
 * - High Urgency (11-15 points): 72 hours (3 days)
 * - Moderate Urgency (6-10 points): 120 hours (5 days)
 * - Low Urgency (0-5 points): 168 hours (7 days)
 */
@Service
public class PriorityCalculationService {

    private static final Logger log = LoggerFactory.getLogger(PriorityCalculationService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    // High density / arterial transit hubs in Bhubaneswar
    private static final List<String> TRANSIT_HUBS = Arrays.asList(
            "iter", "master canteen", "jaydev vihar", "acharya vihar", "baramunda", "patia", "kiit", "station"
    );

    // Critical safety hazard keywords
    private static final List<String> CRITICAL_SAFETY_KEYWORDS = Arrays.asList(
            "spark", "shock", "live wire", "open manhole", "deep trench", "cave in", "caved in", "drowning",
            "toxic", "hospital", "school", "high voltage", "burst pipe", "severely flooded", "electrocution"
    );

    private static final List<String> MODERATE_SAFETY_KEYWORDS = Arrays.asList(
            "accident", "crater", "sinkhole", "overflowing sewage", "slippery", "dark stretch",
            "blind turn", "waterlogging", "mosquito", "hazard"
    );

    /**
     * Compute full 15-point transparent breakdown for a complaint
     */
    public PriorityBreakdownDto calculateBreakdown(Complaint complaint) {
        String title = complaint.getTitle() != null ? complaint.getTitle() : "";
        String desc = complaint.getDescription() != null ? complaint.getDescription() : "";
        String address = complaint.getAddressText() != null ? complaint.getAddressText() : "";
        ComplaintCategory category = complaint.getCategory();
        Instant createdAt = complaint.getCreatedAt() != null ? complaint.getCreatedAt() : Instant.now();
        int upvotes = complaint.getUpvoteCount();

        return calculateBreakdown(title, desc, address, category, createdAt, upvotes);
    }

    /**
     * Overloaded calculator for intake preview
     */
    public PriorityBreakdownDto calculateBreakdown(
            String title,
            String desc,
            String address,
            ComplaintCategory category,
            Instant createdAt,
            int upvotes
    ) {
        String text = (title + " " + desc + " " + address).toLowerCase();

        // 1. Severity: 0 to 5 points
        int severity = 3; // Baseline default
        if (text.contains("catastrophic") || text.contains("severe") || text.contains("massive") || text.contains("huge") || text.contains("burst")) {
            severity = 5;
        } else if (text.contains("deep") || text.contains("heavy") || text.contains("multiple") || text.contains("broken")) {
            severity = 4;
        } else if (text.contains("minor") || text.contains("small") || text.contains("flickering")) {
            severity = 2;
        }

        // 2. Public Safety: 0 to 4 points
        int publicSafety = 0;
        boolean hasCriticalHazard = CRITICAL_SAFETY_KEYWORDS.stream().anyMatch(text::contains);
        boolean hasModerateHazard = MODERATE_SAFETY_KEYWORDS.stream().anyMatch(text::contains);

        if (hasCriticalHazard) {
            publicSafety = 4;
        } else if (hasModerateHazard) {
            publicSafety = 3;
        } else if (category == ComplaintCategory.STREETLIGHT || category == ComplaintCategory.ROAD_DAMAGE) {
            publicSafety = 2;
        } else if (category == ComplaintCategory.DRAINAGE || category == ComplaintCategory.GARBAGE_WASTE) {
            publicSafety = 1;
        }

        // 3. People Affected: 0 to 3 points
        int peopleAffected = 1; // Default residential
        boolean isTransitHub = TRANSIT_HUBS.stream().anyMatch(hub -> text.contains(hub) || address.toLowerCase().contains(hub));
        if (isTransitHub || text.contains("highway") || text.contains("square") || text.contains("junction")) {
            peopleAffected = 3; // Heavy commuter volume
        } else if (text.contains("market") || text.contains("colony main") || text.contains("ward office")) {
            peopleAffected = 2;
        }

        // 4. Duration / Age: 0 to 2 points
        long daysOpen = Duration.between(createdAt, Instant.now()).toDays();
        int duration = 0;
        if (daysOpen >= 7) {
            duration = 2; // > 7 days unresolved
        } else if (daysOpen >= 3) {
            duration = 1; // > 3 days unresolved
        }

        // 5. Community Confirmations: 0 to 1 point
        int confirmations = (upvotes >= 3) ? 1 : 0;

        // Sum and cap between 1 and 15 points
        int totalScore = Math.min(15, Math.max(1, severity + publicSafety + peopleAffected + duration + confirmations));

        // SLA determination
        UrgencyLevel urgency;
        int targetSlaHours;
        if (totalScore >= 11) {
            urgency = UrgencyLevel.HIGH;
            targetSlaHours = 72; // 3 days
        } else if (totalScore >= 6) {
            urgency = UrgencyLevel.MODERATE;
            targetSlaHours = 120; // 5 days
        } else {
            urgency = UrgencyLevel.LOW;
            targetSlaHours = 168; // 7 days
        }

        String rationale = String.format(
                "Severity (%d/5) + Safety Hazard (%d/4) + Affected Volume (%d/3) + Age (%d/2) + Upvotes (%d/1) = %d/15",
                severity, publicSafety, peopleAffected, duration, confirmations, totalScore
        );

        PriorityBreakdownDto dto = new PriorityBreakdownDto();
        dto.setSeverity(severity);
        dto.setPublicSafety(publicSafety);
        dto.setPeopleAffected(peopleAffected);
        dto.setDuration(duration);
        dto.setConfirmations(confirmations);
        dto.setTotalScore(totalScore);
        dto.setUrgency(urgency);
        dto.setTargetSlaHours(targetSlaHours);
        dto.setRationale(rationale);
        dto.setFormula("Severity(0-5) + PublicSafety(0-4) + PeopleAffected(0-3) + Duration(0-2) + Confirmations(0-1)");

        return dto;
    }

    /**
     * Serializes breakdown to JSON for storage in complaint.priority_breakdown_json
     */
    public String toJsonString(PriorityBreakdownDto dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (Exception e) {
            log.error("Failed to serialize PriorityBreakdownDto to JSON", e);
            return "{}";
        }
    }
}
