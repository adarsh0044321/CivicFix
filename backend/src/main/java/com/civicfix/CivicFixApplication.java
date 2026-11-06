package com.civicfix;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * CivicFixApplication - The Main Entry Point
 *
 * Implements @EnableScheduling for Phase 10 automated SLA escalation scans.
 */
@SpringBootApplication
@EnableScheduling
public class CivicFixApplication {

    private static final Logger log = LoggerFactory.getLogger(CivicFixApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(CivicFixApplication.class, args);
    }

    @Bean
    public CommandLineRunner databaseSchemaAlignmentRunner(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                log.info("Aligning PostgreSQL database schema columns for media and resolution URLs...");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN image_url TYPE TEXT;");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN resolution_image_url TYPE TEXT;");
                jdbcTemplate.execute("ALTER TABLE complaints ALTER COLUMN audio_url TYPE TEXT;");
                log.info("Successfully widened image_url, resolution_image_url, and audio_url columns to TEXT.");
            } catch (Exception ex) {
                log.warn("Database column alignment skipped or already up-to-date: {}", ex.getMessage());
            }
        };
    }
}
