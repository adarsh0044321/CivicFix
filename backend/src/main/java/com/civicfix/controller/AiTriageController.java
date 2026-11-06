package com.civicfix.controller;

import com.civicfix.dto.ai.AiImageAnalysisDto;
import com.civicfix.dto.ai.AiVoiceTranscriptionDto;
import com.civicfix.service.GeminiAiService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * AiTriageController - Phase 8 Google Gemini 1.5/2.5 Flash Multimodal & Speech REST Endpoints
 *
 * Provides:
 * 1. Image classification & severity scoring via Gemini Vision
 * 2. Odia/Hindi/English voice grievance transcription & structured field extraction
 * 3. AI service health & configuration status
 */
@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*")
public class AiTriageController {

    private final GeminiAiService geminiAiService;

    public AiTriageController(GeminiAiService geminiAiService) {
        this.geminiAiService = geminiAiService;
    }

    /**
     * Multimodal Image Analysis: Auto-categorize and score damage severity
     */
    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AiImageAnalysisDto> analyzeImage(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "hint", required = false) String hint
    ) {
        byte[] bytes = null;
        String mimeType = "image/jpeg";

        if (file != null && !file.isEmpty()) {
            try {
                bytes = file.getBytes();
                mimeType = file.getContentType();
            } catch (IOException e) {
                // proceed with fallback
            }
        }

        AiImageAnalysisDto result = geminiAiService.analyzeImage(bytes, mimeType, hint);
        return ResponseEntity.ok(result);
    }

    /**
     * Speech-to-Text & Regional Translation: Transcribe voice note in Odia/Hindi/English
     */
    @PostMapping(value = "/transcribe-voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AiVoiceTranscriptionDto> transcribeVoice(
            @RequestParam(value = "audio", required = false) MultipartFile audio,
            @RequestParam(value = "language", required = false, defaultValue = "odia") String language
    ) {
        byte[] bytes = null;
        String mimeType = "audio/webm";

        if (audio != null && !audio.isEmpty()) {
            try {
                bytes = audio.getBytes();
                mimeType = audio.getContentType();
            } catch (IOException e) {
                // proceed with fallback
            }
        }

        AiVoiceTranscriptionDto result = geminiAiService.transcribeVoice(bytes, mimeType, language);
        return ResponseEntity.ok(result);
    }

    /**
     * AI Health & Engine Capabilities Status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAiStatus() {
        Map<String, Object> status = new HashMap<>();
        boolean configured = geminiAiService.isGeminiConfigured();
        status.put("provider", "Google Gemini");
        status.put("model", geminiAiService.getModelName());
        status.put("isLiveApiKeyConfigured", configured);
        status.put("mode", configured ? "LIVE_GEMINI_API" : "INTELLIGENT_DEFENSIVE_FALLBACK");
        status.put("supportedLanguages", new String[]{"Odia", "Hindi", "English"});
        status.put("supportedCategories", new String[]{"ROAD_DAMAGE", "GARBAGE_WASTE", "STREETLIGHT", "DRAINAGE", "WATER_SUPPLY"});
        return ResponseEntity.ok(status);
    }
}
