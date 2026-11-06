package com.civicfix.repository;

import com.civicfix.entity.Complaint;
import com.civicfix.model.enums.ComplaintCategory;
import com.civicfix.model.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {

    Optional<Complaint> findByComplaintId(String complaintId);

    boolean existsByComplaintId(String complaintId);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findByCategory(ComplaintCategory category);

    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByIsOverdueTrue();

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.category = :category")
    long countByCategory(ComplaintCategory category);

    @Query("SELECT COUNT(c) FROM Complaint c WHERE c.status = :status")
    long countByStatus(ComplaintStatus status);
}
