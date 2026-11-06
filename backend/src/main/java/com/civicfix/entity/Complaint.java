package com.civicfix.entity;

import com.civicfix.model.enums.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Complaint Entity - Core Grievance Entity
 *
 * Implements PS-09 requirements:
 * - 5 categories
 * - Priority scoring (0-15) and breakdown
 * - Location mapping (coords + address + confidence)
 * - SLA deadline tracking
 * - Duplicate grouping linkage
 */
@Entity
@Table(name = "complaints")
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "complaint_id", nullable = false, unique = true, length = 32)
    private String complaintId; // e.g. CFX-2026-10001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_worker_id")
    private User assignedWorker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ComplaintCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ComplaintStatus status = ComplaintStatus.SUBMITTED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UrgencyLevel urgency = UrgencyLevel.MODERATE;

    @Column(name = "priority_score", nullable = false)
    private int priorityScore = 5;

    @Column(name = "priority_breakdown_json", columnDefinition = "TEXT")
    private String priorityBreakdownJson;

    @Column(name = "priority_override_reason", columnDefinition = "TEXT")
    private String priorityOverrideReason;

    // Numerical coordinates for Mapbox display
    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(name = "address_text", nullable = false)
    private String addressText;

    @Column(length = 100)
    private String city = "Bhubaneswar";

    @Column(length = 50)
    private String ward;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_confidence", nullable = false, length = 30)
    private LocationConfidence locationConfidence = LocationConfidence.HIGH_EXACT_GPS;

    // Media & Regional Input
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "resolution_image_url", length = 500)
    private String resolutionImageUrl;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "dispute_reason", columnDefinition = "TEXT")
    private String disputeReason;

    @Column(name = "audio_url", length = 500)
    private String audioUrl;

    @Column(name = "original_language_text", columnDefinition = "TEXT")
    private String originalLanguageText;

    @Column(name = "detected_language", length = 50)
    private String detectedLanguage;

    // Community engagement
    @Column(name = "upvote_count", nullable = false)
    private int upvoteCount = 0;

    // SLA & Escalation
    @Column(name = "sla_hours", nullable = false)
    private int slaHours = 120; // Default 5 days

    @Column(name = "sla_deadline", nullable = false)
    private Instant slaDeadline;

    @Column(name = "is_overdue", nullable = false)
    private boolean isOverdue = false;

    // Deduplication clustering
    @Column(name = "is_duplicate", nullable = false)
    private boolean isDuplicate = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_complaint_id")
    private Complaint parentComplaint;

    @Column(name = "duplicate_group_id", length = 50)
    private String duplicateGroupId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public Complaint() {}

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }

    public User getAssignedWorker() { return assignedWorker; }
    public void setAssignedWorker(User assignedWorker) { this.assignedWorker = assignedWorker; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ComplaintCategory getCategory() { return category; }
    public void setCategory(ComplaintCategory category) { this.category = category; }

    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }

    public UrgencyLevel getUrgency() { return urgency; }
    public void setUrgency(UrgencyLevel urgency) { this.urgency = urgency; }

    public int getPriorityScore() { return priorityScore; }
    public void setPriorityScore(int priorityScore) { this.priorityScore = priorityScore; }

    public String getPriorityBreakdownJson() { return priorityBreakdownJson; }
    public void setPriorityBreakdownJson(String priorityBreakdownJson) { this.priorityBreakdownJson = priorityBreakdownJson; }

    public String getPriorityOverrideReason() { return priorityOverrideReason; }
    public void setPriorityOverrideReason(String priorityOverrideReason) { this.priorityOverrideReason = priorityOverrideReason; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }

    public LocationConfidence getLocationConfidence() { return locationConfidence; }
    public void setLocationConfidence(LocationConfidence locationConfidence) { this.locationConfidence = locationConfidence; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getResolutionImageUrl() { return resolutionImageUrl; }
    public void setResolutionImageUrl(String resolutionImageUrl) { this.resolutionImageUrl = resolutionImageUrl; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public String getDisputeReason() { return disputeReason; }
    public void setDisputeReason(String disputeReason) { this.disputeReason = disputeReason; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    public String getOriginalLanguageText() { return originalLanguageText; }
    public void setOriginalLanguageText(String originalLanguageText) { this.originalLanguageText = originalLanguageText; }

    public String getDetectedLanguage() { return detectedLanguage; }
    public void setDetectedLanguage(String detectedLanguage) { this.detectedLanguage = detectedLanguage; }

    public int getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(int upvoteCount) { this.upvoteCount = upvoteCount; }

    public int getSlaHours() { return slaHours; }
    public void setSlaHours(int slaHours) { this.slaHours = slaHours; }

    public Instant getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(Instant slaDeadline) { this.slaDeadline = slaDeadline; }

    public boolean isOverdue() { return isOverdue; }
    public void setOverdue(boolean overdue) { isOverdue = overdue; }

    public boolean isDuplicate() { return isDuplicate; }
    public void setDuplicate(boolean duplicate) { isDuplicate = duplicate; }

    public Complaint getParentComplaint() { return parentComplaint; }
    public void setParentComplaint(Complaint parentComplaint) { this.parentComplaint = parentComplaint; }

    public String getDuplicateGroupId() { return duplicateGroupId; }
    public void setDuplicateGroupId(String duplicateGroupId) { this.duplicateGroupId = duplicateGroupId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
