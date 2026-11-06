package com.civicfix.controller;

import com.civicfix.dto.ErrorResponseDto;
import com.civicfix.service.WebhookVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

/**
 * WebhookController - Secure Ingress for External System Webhooks
 * Requires verified HMAC-SHA256 signatures with timestamp anti-replay verification.
 */
@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    private final WebhookVerificationService webhookVerificationService;

    public WebhookController(WebhookVerificationService webhookVerificationService) {
        this.webhookVerificationService = webhookVerificationService;
    }

    /**
     * GET /api/v1/webhooks/health - Public health check for webhook listener
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getWebhookHealth() {
        return ResponseEntity.ok(Map.of(
                "status", "LISTENING",
                "security", "HMAC-SHA256_TIMESTAMP_VERIFIED",
                "replayWindowSeconds", 300,
                "timestamp", Instant.now().toString()
        ));
    }

    /**
     * POST /api/v1/webhooks/supabase - Receives Supabase Realtime / Database Change Webhooks
     */
    @PostMapping("/supabase")
    public ResponseEntity<?> handleSupabaseWebhook(
            @RequestHeader(value = "X-CivicFix-Signature", required = false) String signature,
            @RequestHeader(value = "X-CivicFix-Timestamp", required = false) String timestamp,
            @RequestBody(required = false) String payload
    ) {
        if (!webhookVerificationService.verifyWebhook(payload, signature, timestamp)) {
            log.warn("🚨 Unauthorized Supabase webhook attempt rejected");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new ErrorResponseDto(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "Invalid or missing cryptographic webhook signature"
                    )
            );
        }

        log.info("✅ Verified Supabase Database Webhook processed successfully");
        return ResponseEntity.ok(Map.of(
                "status", "PROCESSED",
                "verified", true,
                "timestamp", Instant.now().toString()
        ));
    }

    /**
     * POST /api/v1/webhooks/contractor-status - Receives Field Contractor telemetry / completion alerts
     */
    @PostMapping("/contractor-status")
    public ResponseEntity<?> handleContractorWebhook(
            @RequestHeader(value = "X-CivicFix-Signature", required = false) String signature,
            @RequestHeader(value = "X-CivicFix-Timestamp", required = false) String timestamp,
            @RequestBody(required = false) String payload
    ) {
        if (!webhookVerificationService.verifyWebhook(payload, signature, timestamp)) {
            log.warn("🚨 Unauthorized Contractor telemetry webhook attempt rejected");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new ErrorResponseDto(
                            HttpStatus.UNAUTHORIZED.value(),
                            "Unauthorized",
                            "Invalid or missing cryptographic webhook signature"
                    )
            );
        }

        log.info("✅ Verified Contractor Status Webhook processed successfully");
        return ResponseEntity.ok(Map.of(
                "status", "RECEIVED",
                "verified", true,
                "timestamp", Instant.now().toString()
        ));
    }
}
