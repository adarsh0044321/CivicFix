package com.civicfix.dto;

import com.civicfix.model.enums.ComplaintStatus;
import jakarta.validation.constraints.NotNull;

/**
 * StatusTransitionRequestDto - Phase 11
 *
 * Enforces worker execution and resolution verification workflow:
 * - ASSIGNED -> IN_PROGRESS
 * - IN_PROGRESS -> AWAITING_VERIFICATION (requires resolutionPhotoUrl)
 * - AWAITING_VERIFICATION -> VERIFIED_RESOLVED (citizen/admin verification)
 * - AWAITING_VERIFICATION -> REOPENED_DISPUTED (citizen dispute with +2 penalty escalation)
 */
public class StatusTransitionRequestDto {

    @NotNull(message = "Target status is required")
    private ComplaintStatus targetStatus;

    private String notes;
    private String resolutionPhotoUrl;
    private String disputeReason;
    private String actorRole;
    private String actorId;
    private Integer rating;
    private String reviewTag;

    public StatusTransitionRequestDto() {}

    public ComplaintStatus getTargetStatus() { return targetStatus; }
    public void setTargetStatus(ComplaintStatus targetStatus) { this.targetStatus = targetStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getResolutionPhotoUrl() { return resolutionPhotoUrl; }
    public void setResolutionPhotoUrl(String resolutionPhotoUrl) { this.resolutionPhotoUrl = resolutionPhotoUrl; }

    public String getDisputeReason() { return disputeReason; }
    public void setDisputeReason(String disputeReason) { this.disputeReason = disputeReason; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getActorId() { return actorId; }
    public void setActorId(String actorId) { this.actorId = actorId; }
}
