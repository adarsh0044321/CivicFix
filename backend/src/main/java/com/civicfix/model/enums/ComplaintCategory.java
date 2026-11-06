package com.civicfix.model.enums;

/**
 * ComplaintCategory - The 5 Official Issue Types for PS-09
 * These 5 categories must be used consistently across complaint intake,
 * classification, routing, dashboards, and heatmaps.
 */
public enum ComplaintCategory {
    ROAD_DAMAGE,     // Potholes, road damage, craters, cave-ins
    GARBAGE_WASTE,   // Overflowing bins, uncollected waste, illegal dumps
    STREETLIGHT,     // Broken streetlights, dark roads, electrical hazards
    DRAINAGE,        // Clogged drains, sewage overflow, waterlogging
    WATER_SUPPLY     // Potable water supply disruption, pipe bursts, contaminated water
}
