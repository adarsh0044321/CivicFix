package com.civicfix.service;

import com.civicfix.entity.Complaint;
import com.civicfix.entity.StatusLog;
import com.civicfix.model.enums.ComplaintStatus;
import com.civicfix.repository.ComplaintRepository;
import com.civicfix.repository.StatusLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * SlaEscalationScheduler - Phase 10
 *
 * Scans open civic complaints and triggers automated escalations
 * when resolution target deadlines are breached.
 */
@Service
public class SlaEscalationScheduler {

    private static final Logger log = LoggerFactory.getLogger(SlaEscalationScheduler.class);

    private final ComplaintRepository complaintRepository;
    private final StatusLogRepository statusLogRepository;

    public SlaEscalationScheduler(ComplaintRepository complaintRepository, StatusLogRepository statusLogRepository) {
        this.complaintRepository = complaintRepository;
        this.statusLogRepository = statusLogRepository;
    }

    /**
     * Runs every 2 minutes automatically in the background
     */
    @Scheduled(fixedRate = 120000)
    @Transactional
    public void scheduledSlaScan() {
        evaluateAndEscalateOverdueComplaints();
    }

    /**
     * Scans for open tickets whose deadline has elapsed
     */
    @Transactional
    public List<String> evaluateAndEscalateOverdueComplaints() {
        Instant now = Instant.now();
        List<Complaint> allComplaints = complaintRepository.findAll();
        List<String> escalatedIds = new ArrayList<>();

        for (Complaint complaint : allComplaints) {
            // Only evaluate complaints that are not yet resolved
            if (complaint.getStatus() == ComplaintStatus.VERIFIED_RESOLVED) {
                continue;
            }

            if (complaint.getSlaDeadline() != null && now.isAfter(complaint.getSlaDeadline())) {
                boolean wasAlreadyOverdue = complaint.isOverdue();
                complaint.setOverdue(true);

                // If newly breached, log an automated SLA breach event
                if (!wasAlreadyOverdue) {
                    long overdueHours = Duration.between(complaint.getSlaDeadline(), now).toHours();
                    log.warn("SLA Breach detected for ticket {}: overdue by {} hours", complaint.getComplaintId(), overdueHours);

                    StatusLog breachLog = new StatusLog(
                            complaint,
                            null, // System automated actor
                            complaint.getStatus(),
                            complaint.getStatus(),
                            String.format("AUTOMATED_SLA_BREACH: Target resolution time (%d hrs) breached by %d hrs. Escalated to Municipal Administrator queue.",
                                    complaint.getSlaHours(), overdueHours)
                    );
                    statusLogRepository.save(breachLog);
                }

                complaintRepository.save(complaint);
                escalatedIds.add(complaint.getComplaintId());
            }
        }

        log.info("SLA evaluation completed. Found {} overdue ticket(s).", escalatedIds.size());
        return escalatedIds;
    }
}
