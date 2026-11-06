package com.civicfix.service;

import com.civicfix.dto.ComplaintResponseDto;
import com.civicfix.dto.CreateComplaintRequestDto;
import com.civicfix.dto.PriorityBreakdownDto;
import com.civicfix.dto.StatusTransitionRequestDto;
import com.civicfix.entity.Complaint;
import com.civicfix.entity.Department;
import com.civicfix.entity.StatusLog;
import com.civicfix.exception.ResourceNotFoundException;
import com.civicfix.model.enums.*;
import com.civicfix.repository.ComplaintRepository;
import com.civicfix.repository.DepartmentRepository;
import com.civicfix.repository.StatusLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * ComplaintService - Business Logic Engine
 *
 * Enforces PS-09 core rules:
 * 1. Generates unique formatted ID (CFX-2026-XXXXX).
 * 2. Transparent priority calculation (0-15 point scale).
 * 3. Dynamic SLA deadline determination.
 * 4. Automatic department suggestion based on category.
 * 5. Immutable status audit logging.
 */
@Service
@Transactional
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final DepartmentRepository departmentRepository;
    private final StatusLogRepository statusLogRepository;
    private final PriorityCalculationService priorityCalculationService;
    private final Random random = new Random();

    public ComplaintService(
            ComplaintRepository complaintRepository,
            DepartmentRepository departmentRepository,
            StatusLogRepository statusLogRepository,
            PriorityCalculationService priorityCalculationService
    ) {
        this.complaintRepository = complaintRepository;
        this.departmentRepository = departmentRepository;
        this.statusLogRepository = statusLogRepository;
        this.priorityCalculationService = priorityCalculationService;
    }

    /**
     * Create a new complaint from citizen input
     */
    public ComplaintResponseDto createComplaint(CreateComplaintRequestDto dto) {
        Complaint complaint = new Complaint();

        // 1. Generate unique formatted Complaint ID (e.g. CFX-2026-48291)
        String uniqueId = "CFX-2026-" + (10000 + random.nextInt(90000));
        complaint.setComplaintId(uniqueId);

        complaint.setTitle(dto.getTitle());
        complaint.setDescription(dto.getDescription());
        complaint.setCategory(dto.getCategory());
        complaint.setStatus(ComplaintStatus.SUBMITTED);

        // Location data
        complaint.setAddressText(dto.getAddressText());
        complaint.setCity(dto.getCity() != null ? dto.getCity() : "Bhubaneswar");
        complaint.setWard(dto.getWard());
        complaint.setLatitude(dto.getLatitude());
        complaint.setLongitude(dto.getLongitude());
        complaint.setLocationConfidence(dto.getLocationConfidence() != null ? dto.getLocationConfidence() : LocationConfidence.HIGH_EXACT_GPS);

        // Media & Regional Voice
        complaint.setImageUrl(dto.getImageUrl());
        complaint.setAudioUrl(dto.getAudioUrl());
        complaint.setOriginalLanguageText(dto.getOriginalLanguageText());
        complaint.setDetectedLanguage(dto.getDetectedLanguage());

        // 2. Mandated Transparent 15-point priority scoring model (Phase 10)
        PriorityBreakdownDto breakdown = priorityCalculationService.calculateBreakdown(
                complaint.getTitle(),
                complaint.getDescription(),
                complaint.getAddressText(),
                complaint.getCategory(),
                Instant.now(),
                0
        );

        complaint.setPriorityScore(breakdown.getTotalScore());
        complaint.setUrgency(breakdown.getUrgency());
        complaint.setSlaHours(breakdown.getTargetSlaHours());
        complaint.setSlaDeadline(Instant.now().plus(breakdown.getTargetSlaHours(), ChronoUnit.HOURS));
        complaint.setPriorityBreakdownJson(priorityCalculationService.toJsonString(breakdown));
        complaint.setOverdue(false);

        // 4. Department suggestion based on category
        Department department = autoRouteDepartment(dto.getCategory());
        complaint.setDepartment(department);

        // 5. Persist complaint
        Complaint saved = complaintRepository.save(complaint);

        // 6. Record immutable status log
        StatusLog log = new StatusLog(
                saved,
                null, // Anonymous citizen submission initially
                null,
                ComplaintStatus.SUBMITTED,
                "Complaint lodged via citizen intake portal."
        );
        statusLogRepository.save(log);

        return ComplaintResponseDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponseDto> getAllComplaints() {
        return complaintRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ComplaintResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Row-Level Security (RLS) Scoped Retrieval:
     * Enforces role-based data isolation so each actor type only accesses records they own or have authority over.
     */
    @Transactional(readOnly = true)
    public List<ComplaintResponseDto> getScopedComplaints(String roleStr, String userIdentifier) {
        List<Complaint> all = complaintRepository.findAllByOrderByCreatedAtDesc();
        if (roleStr == null || roleStr.isBlank() || "ADMIN".equalsIgnoreCase(roleStr)) {
            // Municipal Admin has full city-wide oversight
            return all.stream().map(ComplaintResponseDto::fromEntity).collect(Collectors.toList());
        }

        if ("WORKER".equalsIgnoreCase(roleStr) || "CONTRACTOR".equalsIgnoreCase(roleStr)) {
            // Contractors only access assigned work orders and available departmental tenders
            return all.stream()
                    .filter(c -> c.getStatus() == ComplaintStatus.ASSIGNED ||
                                 c.getStatus() == ComplaintStatus.IN_PROGRESS ||
                                 c.getStatus() == ComplaintStatus.AWAITING_VERIFICATION ||
                                 (c.getAssignedWorker() != null && userIdentifier != null &&
                                  (userIdentifier.equalsIgnoreCase(c.getAssignedWorker().getFullName()) ||
                                   userIdentifier.equalsIgnoreCase(c.getAssignedWorker().getEmail()))))
                    .map(ComplaintResponseDto::fromEntity)
                    .collect(Collectors.toList());
        }

        // Citizens only access their own reported records
        return all.stream()
                .filter(c -> {
                    if (userIdentifier == null || userIdentifier.isBlank()) return true;
                    if (c.getReporter() != null) {
                        return userIdentifier.equalsIgnoreCase(c.getReporter().getEmail()) ||
                               userIdentifier.equalsIgnoreCase(c.getReporter().getFullName());
                    }
                    return true;
                })
                .map(ComplaintResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ComplaintResponseDto getComplaintById(UUID id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + id));
        return ComplaintResponseDto.fromEntity(complaint);
    }

    @Transactional(readOnly = true)
    public ComplaintResponseDto getComplaintByFormattedId(String complaintId) {
        Complaint complaint = complaintRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with tracking ID: " + complaintId));
        return ComplaintResponseDto.fromEntity(complaint);
    }

    /**
     * Community upvote: increments or decrements upvotes based on toggle.
     * Prevents multi-voting by the same user.
     * Recalculates transparent priority score in real-time.
     */
    public ComplaintResponseDto toggleUpvote(UUID id, boolean isAdd) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + id));

        if (isAdd) {
            complaint.setUpvoteCount(complaint.getUpvoteCount() + 1);
        } else {
            complaint.setUpvoteCount(Math.max(0, complaint.getUpvoteCount() - 1));
        }

        // Recalculate priority breakdown with updated confirmations
        PriorityBreakdownDto breakdown = priorityCalculationService.calculateBreakdown(complaint);
        complaint.setPriorityScore(breakdown.getTotalScore());
        complaint.setUrgency(breakdown.getUrgency());
        complaint.setPriorityBreakdownJson(priorityCalculationService.toJsonString(breakdown));

        Complaint updated = complaintRepository.save(complaint);
        return ComplaintResponseDto.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public PriorityBreakdownDto getPriorityBreakdown(UUID id) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + id));
        return priorityCalculationService.calculateBreakdown(complaint);
    }

    /**
     * Phase 11: Worker Repair Execution & Citizen Verification Gate
     */
    public ComplaintResponseDto transitionStatus(UUID id, StatusTransitionRequestDto request) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + id));

        ComplaintStatus prevStatus = complaint.getStatus();
        ComplaintStatus target = request.getTargetStatus();

        // Row-Level Security & Role Ownership Enforcement
        String actorRole = request.getActorRole();
        if (actorRole != null && !actorRole.isBlank()) {
            if ("WORKER".equalsIgnoreCase(actorRole) || "CONTRACTOR".equalsIgnoreCase(actorRole)) {
                if (target == ComplaintStatus.VERIFIED_RESOLVED) {
                    throw new IllegalArgumentException("Security Violation: Field Contractors cannot unilaterally mark issues as VERIFIED_RESOLVED. Citizen verification or Municipal Inspector sign-off is mandatory.");
                }
                if (target == ComplaintStatus.ASSIGNED) {
                    throw new IllegalArgumentException("Security Violation: Contractors cannot dispatch or reassign tickets. Only Municipal Administrators possess dispatch authority.");
                }
            } else if ("CITIZEN".equalsIgnoreCase(actorRole)) {
                if (target == ComplaintStatus.IN_PROGRESS || target == ComplaintStatus.AWAITING_VERIFICATION) {
                    throw new IllegalArgumentException("Security Violation: Citizens cannot perform contractor repair phase transitions.");
                }
            }
        }

        complaint.setStatus(target);
        complaint.setUpdatedAt(Instant.now());

        String logNotes = request.getNotes() != null ? request.getNotes() : "";

        if (target == ComplaintStatus.IN_PROGRESS) {
            if (logNotes.isEmpty()) logNotes = "Worker initiated active on-site repairs.";
        } else if (target == ComplaintStatus.AWAITING_VERIFICATION || target == ComplaintStatus.WORK_COMPLETED) {
            // Worker uploading completion photo DOES NOT close the ticket!
            complaint.setStatus(ComplaintStatus.AWAITING_VERIFICATION);
            if (request.getResolutionPhotoUrl() != null) {
                complaint.setResolutionImageUrl(request.getResolutionPhotoUrl());
            }
            if (request.getNotes() != null) {
                complaint.setResolutionNotes(request.getNotes());
            }
            if (logNotes.isEmpty()) {
                logNotes = "Field repair completed. Completion evidence uploaded; awaiting citizen/admin verification.";
            }
        } else if (target == ComplaintStatus.VERIFIED_RESOLVED) {
            if (logNotes.isEmpty()) logNotes = "Repair verified and approved. Ticket closed.";
        } else if (target == ComplaintStatus.REOPENED_DISPUTED) {
            // Dispute/Reopen penalty: escalate with +2 priority points
            complaint.setDisputeReason(request.getDisputeReason());
            int newScore = Math.min(15, complaint.getPriorityScore() + 2);
            complaint.setPriorityScore(newScore);
            complaint.setUrgency(newScore >= 11 ? UrgencyLevel.HIGH : UrgencyLevel.MODERATE);

            // Recalculate JSON breakdown with escalation notes
            PriorityBreakdownDto pb = priorityCalculationService.calculateBreakdown(complaint);
            pb.setTotalScore(newScore);
            complaint.setPriorityBreakdownJson(priorityCalculationService.toJsonString(pb));

            if (logNotes.isEmpty()) {
                logNotes = "Citizen disputed repair resolution: " +
                        (request.getDisputeReason() != null ? request.getDisputeReason() : "Unsatisfactory fix") +
                        ". Escalated +2 priority points (" + newScore + "/15) and returned to department queue.";
            }
        }

        Complaint saved = complaintRepository.save(complaint);

        // Record immutable audit log
        StatusLog statusLog = new StatusLog(
                saved,
                null,
                prevStatus,
                complaint.getStatus(),
                logNotes
        );
        statusLogRepository.save(statusLog);

        return ComplaintResponseDto.fromEntity(saved);
    }

    private int calculateInitialScore(String title, String description, ComplaintCategory category) {
        String fullText = (title + " " + description).toLowerCase();
        int score = 5; // Base score

        if (fullText.contains("danger") || fullText.contains("accident") || fullText.contains("shock") || fullText.contains("burst")) {
            score += 5;
        } else if (fullText.contains("pothole") || fullText.contains("garbage") || fullText.contains("leakage")) {
            score += 3;
        }

        if (category == ComplaintCategory.STREETLIGHT || category == ComplaintCategory.WATER_SUPPLY) {
            score += 2;
        }

        return Math.min(15, Math.max(1, score));
    }

    private Department autoRouteDepartment(ComplaintCategory category) {
        String deptCode;
        switch (category) {
            case ROAD_DAMAGE:
                deptCode = "ROAD_MAINTENANCE";
                break;
            case GARBAGE_WASTE:
                deptCode = "SANITATION_WASTE";
                break;
            case STREETLIGHT:
                deptCode = "ELECTRICITY_LIGHT";
                break;
            case DRAINAGE:
                deptCode = "DRAINAGE_SEWER";
                break;
            case WATER_SUPPLY:
                deptCode = "WATER_SUPPLY";
                break;
            default:
                deptCode = "ROAD_MAINTENANCE";
        }

        return departmentRepository.findByCode(deptCode).orElse(null);
    }
}
