package com.civicfix.service;

import com.civicfix.dto.DuplicateCandidateDto;
import com.civicfix.dto.DuplicateCheckRequestDto;
import com.civicfix.entity.Complaint;
import com.civicfix.model.enums.ComplaintStatus;
import com.civicfix.repository.ComplaintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * DuplicateRadarService - Phase 9 PostGIS & Spatial Duplicate Clustering Engine
 *
 * Implements PS-09 core requirements:
 * 1. Proximity query: Detects same-category issues within a 150-meter radius using geodesic distance.
 * 2. Semantic matching: Jaccard word token similarity on grievance titles.
 * 3. Proactive anti-inflation: Alerts citizens before creating duplicate tickets,
 *    allowing them to upvote the existing master ticket instead of fragmenting municipal resources.
 */
@Service
@Transactional
public class DuplicateRadarService {

    private static final Logger log = LoggerFactory.getLogger(DuplicateRadarService.class);
    private static final double MAX_DISTANCE_METERS = 150.0;

    private final ComplaintRepository complaintRepository;

    public DuplicateRadarService(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    /**
     * Scan for potential duplicate complaints near the given coordinates
     */
    @Transactional(readOnly = true)
    public List<DuplicateCandidateDto> findPotentialDuplicates(DuplicateCheckRequestDto request) {
        if (request.getLatitude() == null || request.getLongitude() == null || request.getCategory() == null) {
            return Collections.emptyList();
        }

        List<Complaint> candidates = complaintRepository.findByCategory(request.getCategory());
        List<DuplicateCandidateDto> matches = new ArrayList<>();

        for (Complaint existing : candidates) {
            // Ignore resolved or closed tickets for duplicate radar
            if (existing.getStatus() == ComplaintStatus.VERIFIED_RESOLVED) {
                continue;
            }

            if (existing.getLatitude() == null || existing.getLongitude() == null) {
                continue;
            }

            double distance = calculateHaversineDistanceMeters(
                    request.getLatitude(),
                    request.getLongitude(),
                    existing.getLatitude(),
                    existing.getLongitude()
            );

            if (distance <= MAX_DISTANCE_METERS) {
                double textSim = calculateJaccardSimilarity(request.getTitle(), existing.getTitle());

                // Combined score: 60% proximity factor + 40% title similarity
                double distanceFactor = (MAX_DISTANCE_METERS - distance) / MAX_DISTANCE_METERS;
                double combinedScore = (distanceFactor * 0.6) + (textSim * 0.4);

                matches.add(new DuplicateCandidateDto(
                        existing.getId(),
                        existing.getComplaintId(),
                        existing.getTitle(),
                        existing.getCategory(),
                        existing.getStatus(),
                        Math.round(distance * 10.0) / 10.0,
                        Math.round(combinedScore * 100.0) / 100.0,
                        existing.getUpvoteCount(),
                        existing.getAddressText(),
                        existing.getDuplicateGroupId()
                ));
            }
        }

        // Sort by highest similarity score first, then closest distance
        matches.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));

        return matches;
    }

    /**
     * Link a child complaint to a parent master complaint with a cluster ID
     */
    public Complaint linkDuplicate(UUID childId, UUID parentId, String clusterId) {
        Complaint child = complaintRepository.findById(childId)
                .orElseThrow(() -> new IllegalArgumentException("Child complaint not found: " + childId));
        Complaint parent = complaintRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent complaint not found: " + parentId));

        String groupId = clusterId != null && !clusterId.trim().isEmpty() ? clusterId : "DUP-" + parent.getComplaintId();

        child.setDuplicate(true);
        child.setParentComplaint(parent);
        child.setDuplicateGroupId(groupId);

        if (parent.getDuplicateGroupId() == null) {
            parent.setDuplicateGroupId(groupId);
            complaintRepository.save(parent);
        }

        return complaintRepository.save(child);
    }

    /**
     * Haversine Geodesic Distance Formula (PostGIS Spherical Geodesic)
     */
    public double calculateHaversineDistanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000.0; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Jaccard Token Word Overlap Similarity
     */
    private double calculateJaccardSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null || s1.trim().isEmpty() || s2.trim().isEmpty()) {
            return 0.5; // neutral baseline if title omitted
        }

        Set<String> words1 = Arrays.stream(s1.toLowerCase().split("\\W+"))
                .filter(w -> w.length() > 2)
                .collect(Collectors.toSet());

        Set<String> words2 = Arrays.stream(s2.toLowerCase().split("\\W+"))
                .filter(w -> w.length() > 2)
                .collect(Collectors.toSet());

        if (words1.isEmpty() || words2.isEmpty()) return 0.5;

        Set<String> intersection = new HashSet<>(words1);
        intersection.retainAll(words2);

        Set<String> union = new HashSet<>(words1);
        union.addAll(words2);

        return (double) intersection.size() / union.size();
    }
}
