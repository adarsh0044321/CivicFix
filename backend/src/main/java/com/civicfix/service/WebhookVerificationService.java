package com.civicfix.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;

/**
 * WebhookVerificationService - Cryptographic Webhook Security Engine
 * Enforces HMAC-SHA256 signature verification and anti-replay timestamp protection
 * on all external webhook notifications (Supabase DB CDC, Twilio SMS, Field Contractor dispatch).
 */
@Service
public class WebhookVerificationService {

    private static final Logger log = LoggerFactory.getLogger(WebhookVerificationService.class);
    private static final String HMAC_SHA256_ALGORITHM = "HmacSHA256";
    private static final long MAX_ALLOWED_TIMESTAMP_DRIFT_SECONDS = 300; // 5 minutes

    @Value("${civicfix.webhook.secret:cfx_sec_prod_whk_2026_supersecure_key}")
    private String webhookSecret;

    /**
     * Verifies that the provided raw payload and timestamp match the HMAC-SHA256 signature.
     *
     * @param payloadRaw        The unaltered raw request body
     * @param signatureHeader   The X-CivicFix-Signature header (format: "sha256=..." or raw hex)
     * @param timestampHeader   The X-CivicFix-Timestamp header (Unix epoch seconds)
     * @return true if authentic, false if tampered or expired
     */
    public boolean verifyWebhook(String payloadRaw, String signatureHeader, String timestampHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            log.warn("❌ Webhook Rejected: Missing signature header");
            return false;
        }

        // 1. Replay Attack Protection: Validate Timestamp Drift
        if (timestampHeader != null && !timestampHeader.isBlank()) {
            try {
                long eventTimestamp = Long.parseLong(timestampHeader.trim());
                long currentTimestamp = Instant.now().getEpochSecond();
                long drift = Math.abs(currentTimestamp - eventTimestamp);

                if (drift > MAX_ALLOWED_TIMESTAMP_DRIFT_SECONDS) {
                    log.warn("❌ Webhook Rejected: Timestamp drift ({}s) exceeds tolerance ({}s)",
                            drift, MAX_ALLOWED_TIMESTAMP_DRIFT_SECONDS);
                    return false;
                }
            } catch (NumberFormatException e) {
                log.warn("❌ Webhook Rejected: Malformed timestamp header: {}", timestampHeader);
                return false;
            }
        }

        // 2. Compute Expected HMAC-SHA256
        try {
            String sanitizedSignature = signatureHeader.trim();
            if (sanitizedSignature.startsWith("sha256=")) {
                sanitizedSignature = sanitizedSignature.substring(7);
            }

            // Bind signature payload to timestamp if timestamp was supplied
            String signedContent = (timestampHeader != null && !timestampHeader.isBlank())
                    ? timestampHeader.trim() + "." + (payloadRaw != null ? payloadRaw : "")
                    : (payloadRaw != null ? payloadRaw : "");

            Mac hmac = Mac.getInstance(HMAC_SHA256_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    HMAC_SHA256_ALGORITHM
            );
            hmac.init(secretKeySpec);

            byte[] expectedHashBytes = hmac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));
            String expectedHex = HexFormat.of().formatHex(expectedHashBytes);

            // 3. Constant-Time Comparison to prevent timing-attack side-channel leaks
            boolean isValid = MessageDigest.isEqual(
                    expectedHex.getBytes(StandardCharsets.UTF_8),
                    sanitizedSignature.toLowerCase().getBytes(StandardCharsets.UTF_8)
            );

            if (!isValid) {
                log.warn("❌ Webhook Rejected: Cryptographic HMAC signature mismatch");
            } else {
                log.info("🛡️ Webhook Verified: Cryptographic HMAC signature authentic");
            }

            return isValid;
        } catch (Exception e) {
            log.error("❌ Webhook Verification Error: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Utility method to generate HMAC signatures for testing or outgoing webhook dispatches.
     */
    public String generateSignature(String payload, String timestamp) {
        try {
            String signedContent = (timestamp != null && !timestamp.isBlank())
                    ? timestamp.trim() + "." + (payload != null ? payload : "")
                    : (payload != null ? payload : "");

            Mac hmac = Mac.getInstance(HMAC_SHA256_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    HMAC_SHA256_ALGORITHM
            );
            hmac.init(secretKeySpec);
            byte[] hash = hmac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));
            return "sha256=" + HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate webhook signature", e);
        }
    }
}
