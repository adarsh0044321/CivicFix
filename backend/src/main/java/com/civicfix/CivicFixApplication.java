package com.civicfix;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * CivicFixApplication - The Main Entry Point
 *
 * Implements @EnableScheduling for Phase 10 automated SLA escalation scans.
 */
@SpringBootApplication
@EnableScheduling
public class CivicFixApplication {

    public static void main(String[] args) {
        SpringApplication.run(CivicFixApplication.class, args);
    }
}
