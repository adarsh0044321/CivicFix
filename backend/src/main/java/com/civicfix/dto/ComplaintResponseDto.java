package com.civicfix.dto;

import com.civicfix.entity.Complaint;
import com.civicfix.model.enums.*;
import java.time.Instant;
import java.util.UUID;

/**
 * ComplaintResponseDto - Safe API Output
 * Decouples client responses from internal database entity columns.
 */
public class ComplaintResponseDto {

    private UUID id;
    private String complaintId;
    private String title;
    private String description;
    private ComplaintCategory category;
    private ComplaintStatus status;
    private UrgencyLevel urgency;
    private int priorityScore;
    private String priorityBreakdownJson;
    private String priorityOverrideReason;

    private Double latitude;
    private Double longitude;
    private String addressText;
    private String city;
    private String ward;
    private LocationConfidence locationConfidence;

    private String imageUrl;
    private String resolutionImageUrl;
    private String resolutionNotes;
    private String disputeReason;
    private String audioUrl;
    private String originalLanguageText;
    private String detectedLanguage;

    private int upvoteCount;
    private int slaHours;
    private Instant slaDeadline;
    private boolean isOverdue;

    private boolean isDuplicate;
    private String duplicateGroupId;

    private Integer citizenRating;
    private String reviewTag;

    private String departmentName;
    private String assignedWorkerName;
    private String reporterName;

    private Instant createdAt;
    private Instant updatedAt;

    public ComplaintResponseDto() {}

    public static ComplaintResponseDto fromEntity(Complaint c) {
        ComplaintResponseDto dto = new ComplaintResponseDto();
        dto.id = c.getId();
        dto.complaintId = c.getComplaintId();
        dto.title = c.getTitle();
        dto.description = c.getDescription();
        dto.category = c.getCategory();
        dto.status = c.getStatus();
        dto.urgency = c.getUrgency();
        dto.priorityScore = c.getPriorityScore();
        dto.priorityBreakdownJson = c.getPriorityBreakdownJson();
        dto.priorityOverrideReason = c.getPriorityOverrideReason();

        dto.latitude = c.getLatitude();
        dto.longitude = c.getLongitude();
        dto.addressText = c.getAddressText();
        dto.city = c.getCity();
        dto.ward = c.getWard();
        dto.locationConfidence = c.getLocationConfidence();

        dto.imageUrl = c.getImageUrl();
        dto.resolutionImageUrl = c.getResolutionImageUrl();
        dto.resolutionNotes = c.getResolutionNotes();
        dto.disputeReason = c.getDisputeReason();
        dto.audioUrl = c.getAudioUrl();
        dto.originalLanguageText = c.getOriginalLanguageText();
        dto.detectedLanguage = c.getDetectedLanguage();

        dto.upvoteCount = c.getUpvoteCount();
        dto.slaHours = c.getSlaHours();
        dto.slaDeadline = c.getSlaDeadline();
        dto.isOverdue = c.isOverdue();

        dto.isDuplicate = c.isDuplicate();
        dto.duplicateGroupId = c.getDuplicateGroupId();
        dto.citizenRating = c.getCitizenRating();
        dto.reviewTag = c.getReviewTag();

        dto.departmentName = c.getDepartment() != null ? c.getDepartment().getName() : "Unassigned";
        dto.assignedWorkerName = c.getAssignedWorker() != null ? c.getAssignedWorker().getFullName() : "Unassigned";
        dto.reporterName = c.getReporter() != null ? c.getReporter().getFullName() : "Anonymous Citizen";

        dto.createdAt = c.getCreatedAt();
        dto.updatedAt = c.getUpdatedAt();
        return dto;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public String getComplaintId() { return complaintId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public ComplaintCategory getCategory() { return category; }
    public ComplaintStatus getStatus() { return status; }
    public UrgencyLevel getUrgency() { return urgency; }
    public int getPriorityScore() { return priorityScore; }
    public String getPriorityBreakdownJson() { return priorityBreakdownJson; }
    public String getPriorityOverrideReason() { return priorityOverrideReason; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
    public String getAddressText() { return addressText; }
    public String getCity() { return city; }
    public String getWard() { return ward; }
    public LocationConfidence getLocationConfidence() { return locationConfidence; }
    public String getImageUrl() { return imageUrl; }
    public String getResolutionImageUrl() { return resolutionImageUrl; }
    public String getResolutionNotes() { return resolutionNotes; }
    public String getDisputeReason() { return disputeReason; }
    public String getAudioUrl() { return audioUrl; }
    public String getOriginalLanguageText() { return originalLanguageText; }
    public String getDetectedLanguage() { return detectedLanguage; }
    public int getUpvoteCount() { return upvoteCount; }
    public int getSlaHours() { return slaHours; }
    public Instant getSlaDeadline() { return slaDeadline; }
    public boolean isOverdue() { return isOverdue; }
    public boolean isDuplicate() { return isDuplicate; }
    public String getDuplicateGroupId() { return duplicateGroupId; }
    public Integer getCitizenRating() { return citizenRating; }
    public void setCitizenRating(Integer citizenRating) { this.citizenRating = citizenRating; }
    public String getReviewTag() { return reviewTag; }
    public void setReviewTag(String reviewTag) { this.reviewTag = reviewTag; }
    public String getDepartmentName() { return departmentName; }
    public String getAssignedWorkerName() { return assignedWorkerName; }
    public String getReporterName() { return reporterName; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
