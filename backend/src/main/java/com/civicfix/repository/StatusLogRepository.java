package com.civicfix.repository;

import com.civicfix.entity.StatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StatusLogRepository extends JpaRepository<StatusLog, UUID> {
    List<StatusLog> findByComplaintIdOrderByCreatedAtAsc(UUID complaintId);
}
