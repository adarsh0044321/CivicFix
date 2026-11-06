package com.civicfix.dto;

import java.util.HashMap;
import java.util.Map;

/**
 * CivicMetricsSummaryDto - Aggregated Municipal redressing metrics
 *
 * Data structure supporting city-wide analytics, SLA compliance monitoring,
 * and satisfaction indicators across municipal grievance domains.
 * Authored by Data Structure Module (Ujjawal Singh Rajput).
 */
public class CivicMetricsSummaryDto {

    private long totalComplaints;
    private long activeComplaints;
    private long resolvedComplaints;
    private long overdueComplaints;
    private double averageResolutionHours;
    private double citizenSatisfactionAverage;
    private long ratedCount;
    private Map<String, Long> categoryBreakdown = new HashMap<>();
    private Map<String, Long> statusBreakdown = new HashMap<>();

    public CivicMetricsSummaryDto() {}

    public long getTotalComplaints() { return totalComplaints; }
    public void setTotalComplaints(long totalComplaints) { this.totalComplaints = totalComplaints; }

    public long getActiveComplaints() { return activeComplaints; }
    public void setActiveComplaints(long activeComplaints) { this.activeComplaints = activeComplaints; }

    public long getResolvedComplaints() { return resolvedComplaints; }
    public void setResolvedComplaints(long resolvedComplaints) { this.resolvedComplaints = resolvedComplaints; }

    public long getOverdueComplaints() { return overdueComplaints; }
    public void setOverdueComplaints(long overdueComplaints) { this.overdueComplaints = overdueComplaints; }

    public double getAverageResolutionHours() { return averageResolutionHours; }
    public void setAverageResolutionHours(double averageResolutionHours) { this.averageResolutionHours = averageResolutionHours; }

    public double getCitizenSatisfactionAverage() { return citizenSatisfactionAverage; }
    public void setCitizenSatisfactionAverage(double citizenSatisfactionAverage) { this.citizenSatisfactionAverage = citizenSatisfactionAverage; }

    public long getRatedCount() { return ratedCount; }
    public void setRatedCount(long ratedCount) { this.ratedCount = ratedCount; }

    public Map<String, Long> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(Map<String, Long> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }

    public Map<String, Long> getStatusBreakdown() { return statusBreakdown; }
    public void setStatusBreakdown(Map<String, Long> statusBreakdown) { this.statusBreakdown = statusBreakdown; }
}
