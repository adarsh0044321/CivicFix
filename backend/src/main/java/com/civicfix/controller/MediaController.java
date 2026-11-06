package com.civicfix.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * MediaController - Phase 7 Complaint Photo Upload & Verification Proof Service
 *
 * Implements PS-09 media handling:
 * - Validates file types (JPG, JPEG, PNG, WEBP)
 * - Restricts file size (<= 5 MB)
 * - Returns clean URL path for storage in ComplaintEntity
 */
@RestController
@RequestMapping("/api/v1/complaints/media")
@CrossOrigin(origins = "*")
public class MediaController {

    private static final String UPLOAD_DIR = "uploads/complaints";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    public MediaController() {
        File uploadFolder = new File(UPLOAD_DIR);
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadImage(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();

        if (file.isEmpty()) {
            response.put("error", "No file provided");
            return ResponseEntity.badRequest().body(response);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            response.put("error", "File size exceeds 5 MB limit");
            return ResponseEntity.badRequest().body(response);
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        }

        if (!extension.matches("\\.(jpg|jpeg|png|webp)")) {
            response.put("error", "Only JPG, PNG, and WEBP image formats are supported");
            return ResponseEntity.badRequest().body(response);
        }

        String uniqueFileName = UUID.randomUUID().toString() + extension;
        Path targetPath = Paths.get(UPLOAD_DIR).resolve(uniqueFileName);

        try {
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            String fileUrl = "/api/v1/complaints/media/view/" + uniqueFileName;

            response.put("status", "SUCCESS");
            response.put("imageUrl", fileUrl);
            response.put("fileName", originalFilename);
            response.put("sizeBytes", file.getSize());
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            response.put("error", "Failed to store image: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/view/{fileName:.+}")
    public ResponseEntity<byte[]> viewImage(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(fileName);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            byte[] imageBytes = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "image/jpeg";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(imageBytes);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
