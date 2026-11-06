package com.civicfix.controller;

import com.civicfix.service.DbSeederService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * DevSeedController - Phase 6 Seed Data & Testing Reset Endpoint
 *
 * Allows developers and judges to quickly reset or reload demonstration scenarios
 * without manual database scripts.
 */
@RestController
@RequestMapping("/api/v1/dev")
@CrossOrigin(origins = "*")
public class DevSeedController {

    private final DbSeederService dbSeederService;

    public DevSeedController(DbSeederService dbSeederService) {
        this.dbSeederService = dbSeederService;
    }

    /**
     * Trigger fresh database re-seeding with realistic Bhubaneswar complaints
     */
    @PostMapping("/seed-reset")
    public ResponseEntity<Map<String, Object>> resetSeedData() {
        Map<String, Object> result = dbSeederService.seedAll(true);
        return ResponseEntity.ok(result);
    }

    /**
     * Check current database seeding status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> result = dbSeederService.seedAll(false);
        return ResponseEntity.ok(result);
    }
}
