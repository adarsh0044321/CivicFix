package com.civicfix.dto;

import com.civicfix.model.enums.ComplaintCategory;
import com.civicfix.model.enums.ComplaintStatus;

import java.util.UUID;

/**
 * DuplicateCandidateDto - Output of Phase 9 PostGIS & Spatial Duplicate Radar
 * Flags potential duplicates within 150 meters before a citizen submits.
 */
public class DuplicateCandidateDto {

    private UUID id;
    private String complaintId;
    private String title;
    private ComplaintCategory category;
    private ComplaintStatus status;
    private double distanceMeters;
    private double similarityScore; // 0.0 to 1.0
    private int upvoteCount;
    private String addressText;
    private String duplicateGroupId;

    public DuplicateCandidateDto() {}

    public DuplicateCandidateDto(
            UUID id,
            String complaintId,
            String title,
            ComplaintCategory category,
            ComplaintStatus status,
            double distanceMeters,
            double similarityScore,
            int upvoteCount,
            String addressText,
            String duplicateGroupId
    ) {
        this.id = id;
        this.complaintId = complaintId;
        this.title = title;
        this.category = category;
        this.status = status;
        this.distanceMeters = distanceMeters;
        this.similarityScore = similarityScore;
        this.upvoteCount = upvoteCount;
        this.addressText = addressText;
        this.duplicateGroupId = duplicateGroupId;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getComplaintId() { return complaintId; }
    public void setComplaintId(String complaintId) { this.complaintId = complaintId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public ComplaintCategory getCategory() { return category; }
    public void setCategory(ComplaintCategory category) { this.category = category; }

    public ComplaintStatus getStatus() { return status; }
    public void setStatus(ComplaintStatus status) { this.status = status; }

    public double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(double distanceMeters) { this.distanceMeters = distanceMeters; }

    public double getSimilarityScore() { return similarityScore; }
    public void setSimilarityScore(double similarityScore) { this.similarityScore = similarityScore; }

    public int getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(int upvoteCount) { this.upvoteCount = upvoteCount; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public String getDuplicateGroupId() { return duplicateGroupId; }
    public void setDuplicateGroupId(String duplicateGroupId) { this.duplicateGroupId = duplicateGroupId; }
}
