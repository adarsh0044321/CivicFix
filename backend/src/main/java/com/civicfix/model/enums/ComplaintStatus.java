package com.civicfix.model.enums;

/**
 * ComplaintStatus - Complaint Lifecycle States
 *
 * Core rule: A field worker uploading a completion photograph transitions
 * the complaint to AWAITING_VERIFICATION, NOT closed.
 * Only the citizen reporter or an administrator can transition to VERIFIED_RESOLVED.
 */
public enum ComplaintStatus {
    SUBMITTED,              // Newly lodged by citizen
    ASSIGNED,               // Routed to department and dispatched to worker
    IN_PROGRESS,            // Worker is actively resolving the issue on site
    WORK_COMPLETED,         // Worker completed physical repair
    AWAITING_VERIFICATION,  // Proof photo uploaded; citizen/admin must verify
    VERIFIED_RESOLVED,      // Issue confirmed resolved and permanently closed
    REOPENED_DISPUTED       // Citizen disputed fix; ticket escalated with +2 priority
}
