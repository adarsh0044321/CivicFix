package com.civicfix.controller;

import com.civicfix.dto.ComplaintResponseDto;
import com.civicfix.dto.CreateComplaintRequestDto;
import com.civicfix.dto.PriorityBreakdownDto;
import com.civicfix.dto.StatusTransitionRequestDto;
import com.civicfix.dto.StatusLogResponseDto;
import com.civicfix.dto.CivicMetricsSummaryDto;
import com.civicfix.service.ComplaintService;
import com.civicfix.service.SlaEscalationScheduler;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * ComplaintController - Core REST API for Civic Complaints
 * Handles complaint intake, public tracking, listing, community upvoting,
 * transparent priority breakdown, and SLA evaluation.
 */
@RestController
@RequestMapping("/api/v1")
public class ComplaintController {

    private final ComplaintService complaintService;
    private final SlaEscalationScheduler slaEscalationScheduler;

    public ComplaintController(ComplaintService complaintService, SlaEscalationScheduler slaEscalationScheduler) {
        this.complaintService = complaintService;
        this.slaEscalationScheduler = slaEscalationScheduler;
    }

    /**
     * POST /api/v1/complaints - Citizen lodging new complaint
     * @Valid triggers automatic Jakarta validation on the request DTO.
     */
    @PostMapping("/complaints")
    public ResponseEntity<ComplaintResponseDto> createComplaint(
            @Valid @RequestBody CreateComplaintRequestDto requestDto
    ) {
        ComplaintResponseDto response = complaintService.createComplaint(requestDto);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * GET /api/v1/complaints - Retrieve all complaints (Admin & Public feed)
     */
    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintResponseDto>> getAllComplaints() {
        return ResponseEntity.ok(complaintService.getAllComplaints());
    }

    /**
     * GET /api/v1/complaints/scoped - RLS Role-Scoped Data Access
     * Automatically filters records based on authenticated/queried role and user identity.
     */
    @GetMapping("/complaints/scoped")
    public ResponseEntity<List<ComplaintResponseDto>> getScopedComplaints(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String userIdentifier
    ) {
        return ResponseEntity.ok(complaintService.getScopedComplaints(role, userIdentifier));
    }

    /**
     * GET /api/v1/complaints/{id} - Retrieve complaint by UUID
     */
    @GetMapping("/complaints/{id}")
    public ResponseEntity<ComplaintResponseDto> getComplaintById(@PathVariable UUID id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    /**
     * GET /api/v1/public/complaints/{complaintId} - Public tracking by formatted ID (CFX-2026-XXXXX)
     * Accessible without authentication!
     */
    @GetMapping("/public/complaints/{complaintId}")
    public ResponseEntity<ComplaintResponseDto> getPublicComplaint(@PathVariable String complaintId) {
        return ResponseEntity.ok(complaintService.getComplaintByFormattedId(complaintId));
    }

    /**
     * POST /api/v1/complaints/{id}/upvote - Community confirmation (toggle support)
     */
    @PostMapping("/complaints/{id}/upvote")
    public ResponseEntity<ComplaintResponseDto> upvoteComplaint(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean isAdd
    ) {
        return ResponseEntity.ok(complaintService.toggleUpvote(id, isAdd));
    }

    /**
     * GET /api/v1/complaints/{id}/priority-breakdown - Phase 10 Transparent Breakdown
     */
    @GetMapping("/complaints/{id}/priority-breakdown")
    public ResponseEntity<PriorityBreakdownDto> getPriorityBreakdown(@PathVariable UUID id) {
        return ResponseEntity.ok(complaintService.getPriorityBreakdown(id));
    }

    /**
     * POST /api/v1/complaints/sla/evaluate - Trigger SLA breach scan on demand
     */
    @PostMapping("/complaints/sla/evaluate")
    public ResponseEntity<List<String>> triggerSlaEvaluation() {
        List<String> escalatedIds = slaEscalationScheduler.evaluateAndEscalateOverdueComplaints();
        return ResponseEntity.ok(escalatedIds);
    }

    /**
     * POST /api/v1/complaints/{id}/transition-status - Phase 11 Resolution Verification Gate
     */
    @PostMapping("/complaints/{id}/transition-status")
    public ResponseEntity<ComplaintResponseDto> transitionStatus(
            @PathVariable UUID id,
            @Valid @RequestBody StatusTransitionRequestDto request
    ) {
        return ResponseEntity.ok(complaintService.transitionStatus(id, request));
    }
}
