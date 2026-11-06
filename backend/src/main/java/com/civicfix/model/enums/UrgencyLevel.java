package com.civicfix.model.enums;

/**
 * UrgencyLevel - SLA Resolution Time Targets
 * Derived transparently from the 15-point priority score:
 *   - HIGH     (11-15 points): 3 days (72 hours)
 *   - MODERATE (6-10 points) : 5 days (120 hours)
 *   - LOW      (0-5 points)  : 7 days (168 hours)
 */
public enum UrgencyLevel {
    LOW(168),       // 7 days
    MODERATE(120),  // 5 days
    HIGH(72);       // 3 days

    private final int defaultSlaHours;

    UrgencyLevel(int defaultSlaHours) {
        this.defaultSlaHours = defaultSlaHours;
    }

    public int getDefaultSlaHours() {
        return defaultSlaHours;
    }
}
