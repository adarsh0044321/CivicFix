package com.civicfix.dto;

import com.civicfix.model.enums.ComplaintCategory;
import com.civicfix.model.enums.LocationConfidence;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * CreateComplaintRequestDto - Validated Input for Complaint Intake
 * Jakarta validation annotations protect the database from corrupt or empty data.
 */
public class CreateComplaintRequestDto {

    @NotBlank(message = "Title is required")
    @Size(min = 5, max = 200, message = "Title must be between 5 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 4000, message = "Description must be at least 10 characters")
    private String description;

    @NotNull(message = "Category is required (one of ROAD_DAMAGE, GARBAGE_WASTE, STREETLIGHT, DRAINAGE, WATER_SUPPLY)")
    private ComplaintCategory category;

    @NotBlank(message = "Address text is required")
    private String addressText;

    private String city = "Bhubaneswar";
    private String ward;

    private Double latitude;
    private Double longitude;

    private LocationConfidence locationConfidence = LocationConfidence.HIGH_EXACT_GPS;

    private String imageUrl;
    private String audioUrl;
    private String originalLanguageText;
    private String detectedLanguage;

    public CreateComplaintRequestDto() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ComplaintCategory getCategory() { return category; }
    public void setCategory(ComplaintCategory category) { this.category = category; }

    public String getAddressText() { return addressText; }
    public void setAddressText(String addressText) { this.addressText = addressText; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public LocationConfidence getLocationConfidence() { return locationConfidence; }
    public void setLocationConfidence(LocationConfidence locationConfidence) { this.locationConfidence = locationConfidence; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    public String getOriginalLanguageText() { return originalLanguageText; }
    public void setOriginalLanguageText(String originalLanguageText) { this.originalLanguageText = originalLanguageText; }

    public String getDetectedLanguage() { return detectedLanguage; }
    public void setDetectedLanguage(String detectedLanguage) { this.detectedLanguage = detectedLanguage; }
}
