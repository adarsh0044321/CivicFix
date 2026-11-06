package com.civicfix.controller;

import com.civicfix.dto.ComplaintResponseDto;
import com.civicfix.dto.DuplicateCandidateDto;
import com.civicfix.dto.DuplicateCheckRequestDto;
import com.civicfix.entity.Complaint;
import com.civicfix.service.DuplicateRadarService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * DuplicateRadarController - Phase 9 PostGIS & Spatial Proximity Duplicate Radar
 */
@RestController
@RequestMapping("/api/v1/complaints/duplicates")
@CrossOrigin(origins = "*")
public class DuplicateRadarController {

    private final DuplicateRadarService duplicateRadarService;

    public DuplicateRadarController(DuplicateRadarService duplicateRadarService) {
        this.duplicateRadarService = duplicateRadarService;
    }

    /**
     * Proactive Duplicate Radar: Checks for same-category complaints within 150m
     */
    @PostMapping("/radar")
    public ResponseEntity<List<DuplicateCandidateDto>> scanDuplicates(@RequestBody DuplicateCheckRequestDto request) {
        List<DuplicateCandidateDto> candidates = duplicateRadarService.findPotentialDuplicates(request);
        return ResponseEntity.ok(candidates);
    }

    /**
     * Administrative Merge / Cluster Link: Links a duplicate ticket under a master ticket
     */
    @PostMapping("/link")
    public ResponseEntity<ComplaintResponseDto> linkDuplicate(
            @RequestParam("childId") UUID childId,
            @RequestParam("parentId") UUID parentId,
            @RequestParam(value = "clusterId", required = false) String clusterId
    ) {
        Complaint updated = duplicateRadarService.linkDuplicate(childId, parentId, clusterId);
        return ResponseEntity.ok(ComplaintResponseDto.fromEntity(updated));
    }
}
