package com.civicfix.dto;

import com.civicfix.entity.StatusLog;
import com.civicfix.model.enums.ComplaintStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * StatusLogResponseDto - Immutable Audit Trail Response
 *
 * Exposes the historical sequence of state transitions, actor interventions,
 * and dispatch/resolution notes for a civic complaint.
 * Authored by Data Structure Module (Ujjawal Singh Rajput).
 */
public class StatusLogResponseDto {

    private UUID id;
    private UUID complaintId;
    private ComplaintStatus fromStatus;
    private ComplaintStatus toStatus;
    private String remarks;
    private String changedByName;
    private String changedByRole;
    private Instant createdAt;

    public StatusLogResponseDto() {}

    public static StatusLogResponseDto fromEntity(StatusLog entity) {
        StatusLogResponseDto dto = new StatusLogResponseDto();
        dto.setId(entity.getId());
        if (entity.getComplaint() != null) {
            dto.setComplaintId(entity.getComplaint().getId());
        }
        dto.setFromStatus(entity.getFromStatus());
        dto.setToStatus(entity.getToStatus());
        dto.setRemarks(entity.getRemarks());
        if (entity.getChangedBy() != null) {
            dto.setChangedByName(entity.getChangedBy().getFullName());
            dto.setChangedByRole(entity.getChangedBy().getRole() != null ? entity.getChangedBy().getRole().name() : null);
        } else {
            dto.setChangedByName("System Dispatcher");
            dto.setChangedByRole("SYSTEM");
        }
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getComplaintId() { return complaintId; }
    public void setComplaintId(UUID complaintId) { this.complaintId = complaintId; }

    public ComplaintStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(ComplaintStatus fromStatus) { this.fromStatus = fromStatus; }

    public ComplaintStatus getToStatus() { return toStatus; }
    public void setToStatus(ComplaintStatus toStatus) { this.toStatus = toStatus; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getChangedByName() { return changedByName; }
    public void setChangedByName(String changedByName) { this.changedByName = changedByName; }

    public String getChangedByRole() { return changedByRole; }
    public void setChangedByRole(String changedByRole) { this.changedByRole = changedByRole; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
