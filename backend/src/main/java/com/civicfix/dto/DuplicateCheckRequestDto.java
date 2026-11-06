package com.civicfix.dto;

import com.civicfix.model.enums.ComplaintCategory;

public class DuplicateCheckRequestDto {

    private ComplaintCategory category;
    private Double latitude;
    private Double longitude;
    private String title;

    public DuplicateCheckRequestDto() {}

    public DuplicateCheckRequestDto(ComplaintCategory category, Double latitude, Double longitude, String title) {
        this.category = category;
        this.latitude = latitude;
        this.longitude = longitude;
        this.title = title;
    }

    public ComplaintCategory getCategory() { return category; }
    public void setCategory(ComplaintCategory category) { this.category = category; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}
