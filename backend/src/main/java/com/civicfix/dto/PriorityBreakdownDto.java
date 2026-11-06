package com.civicfix.dto;

import com.civicfix.model.enums.UrgencyLevel;

/**
 * PriorityBreakdownDto - Phase 10
 * Transparent 15-point priority breakdown
 */
public class PriorityBreakdownDto {

    private int severity;           // 0 to 5
    private int publicSafety;       // 0 to 4
    private int peopleAffected;     // 0 to 3
    private int duration;           // 0 to 2
    private int confirmations;      // 0 to 1
    private int totalScore;         // 0 to 15
    private UrgencyLevel urgency;
    private int targetSlaHours;
    private String rationale;
    private String formula;

    public PriorityBreakdownDto() {}

    public int getSeverity() { return severity; }
    public void setSeverity(int severity) { this.severity = severity; }

    public int getPublicSafety() { return publicSafety; }
    public void setPublicSafety(int publicSafety) { this.publicSafety = publicSafety; }

    public int getPeopleAffected() { return peopleAffected; }
    public void setPeopleAffected(int peopleAffected) { this.peopleAffected = peopleAffected; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public int getConfirmations() { return confirmations; }
    public void setConfirmations(int confirmations) { this.confirmations = confirmations; }

    public int getTotalScore() { return totalScore; }
    public void setTotalScore(int totalScore) { this.totalScore = totalScore; }

    public UrgencyLevel getUrgency() { return urgency; }
    public void setUrgency(UrgencyLevel urgency) { this.urgency = urgency; }

    public int getTargetSlaHours() { return targetSlaHours; }
    public void setTargetSlaHours(int targetSlaHours) { this.targetSlaHours = targetSlaHours; }

    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }

    public String getFormula() { return formula; }
    public void setFormula(String formula) { this.formula = formula; }
}
