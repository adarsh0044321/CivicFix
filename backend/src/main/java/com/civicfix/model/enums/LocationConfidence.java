package com.civicfix.model.enums;

/**
 * LocationConfidence - Anti-Silent Rejection Indicator
 *
 * Core rule from PS-09: "Do not silently reject complaints even when location
 * details are vague."
 *
 * HIGH_EXACT_GPS      = High precision GPS coordinates from device sensor
 * LANDMARK_RESOLVED   = Location matched via landmark dictionary / reverse geocoder
 * LOW_VAGUE_TRIAGE    = Vague description; retained and flagged for admin review
 */
public enum LocationConfidence {
    HIGH_EXACT_GPS,
    LANDMARK_RESOLVED,
    LOW_VAGUE_TRIAGE
}
