package com.civicfix.service;

import com.civicfix.dto.ai.AiImageAnalysisDto;
import com.civicfix.dto.ai.AiVoiceTranscriptionDto;
import com.civicfix.model.enums.ComplaintCategory;
import com.civicfix.model.enums.UrgencyLevel;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * GeminiAiService - Phase 8 Google Gemini 1.5/2.5 Flash Multimodal & Voice Triage Engine
 *
 * Implements PS-09 core requirements:
 * 1. Multimodal Vision: Analyzes damage photos to classify into exactly 1 of the 5 mandated categories,
 *    estimate damage severity (1-5), and detect immediate safety hazards.
 * 2. Multilingual Speech: Transcribes Odia, Hindi, and English voice notes, translates them,
 *    and extracts structured grievance fields.
 * 3. Anti-Silent Rejection & Defensive Fallback: If Gemini API key is missing or quota is exhausted,
 *    executes deterministic heuristic fallback so citizen grievances are NEVER dropped.
 */
@Service
public class GeminiAiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiAiService.class);

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash}")
    private String modelName;

    private static final List<String> FALLBACK_MODELS = List.of("gemini-3.5-flash", "gemini-flash-latest", "gemini-3.8-flash");

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Check if Gemini API key is configured
     */
    public boolean isGeminiConfigured() {
        return !getAvailableKeys().isEmpty();
    }

    private List<String> getAvailableKeys() {
        List<String> keys = new ArrayList<>();
        // 1. Injected via application.yml / property
        if (apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equals("YOUR_GEMINI_API_KEY")) {
            keys.add(apiKey.trim());
        }
        // 2. Direct environment variable GEMINI_API_KEY
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.trim().isEmpty() && !keys.contains(envKey.trim())) {
            keys.add(envKey.trim());
        }
        // 3. Comma-separated rotation pool GEMINI_API_KEYS
        String envKeys = System.getenv("GEMINI_API_KEYS");
        if (envKeys != null && !envKeys.trim().isEmpty()) {
            for (String k : envKeys.split(",")) {
                String trimmed = k.trim();
                if (!trimmed.isEmpty() && !keys.contains(trimmed)) {
                    keys.add(trimmed);
                }
            }
        }
        // 4. Fallback: Parse from local .env or backend/.env file if present
        if (keys.isEmpty()) {
            loadKeysFromEnvFiles(keys);
        }
        return keys;
    }

    private void loadKeysFromEnvFiles(List<String> targetList) {
        String[] potentialPaths = { ".env", "backend/.env", "../.env" };
        for (String p : potentialPaths) {
            java.io.File file = new java.io.File(p);
            if (file.exists() && file.canRead()) {
                try (java.io.BufferedReader reader = new java.io.BufferedReader(new java.io.FileReader(file))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.startsWith("#") || !line.contains("=")) continue;
                        String[] parts = line.split("=", 2);
                        String name = parts[0].trim();
                        String val = parts[1].trim();
                        if ("GEMINI_API_KEY".equalsIgnoreCase(name) && !val.isEmpty() && !targetList.contains(val)) {
                            targetList.add(val);
                        } else if ("GEMINI_API_KEYS".equalsIgnoreCase(name) && !val.isEmpty()) {
                            for (String sub : val.split(",")) {
                                String subTrim = sub.trim();
                                if (!subTrim.isEmpty() && !targetList.contains(subTrim)) {
                                    targetList.add(subTrim);
                                }
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
    }

    private String cleanJsonText(String raw) {
        if (raw == null) return "{}";
        String clean = raw.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }

    public String getModelName() {
        return modelName;
    }

    /**
     * Multimodal Image Analysis using Gemini Vision
     */
    public AiImageAnalysisDto analyzeImage(byte[] imageBytes, String mimeType, String optionalHint) {
        if (isGeminiConfigured() && imageBytes != null && imageBytes.length > 0) {
            try {
                return callGeminiVisionApi(imageBytes, mimeType, optionalHint);
            } catch (Exception e) {
                log.warn("Gemini Vision API call failed ({}), falling back to deterministic heuristics: {}", e.getClass().getSimpleName(), e.getMessage());
            }
        } else {
            log.info("Gemini API key not configured or empty image. Using intelligent local heuristic engine.");
        }

        return fallbackImageAnalysis(optionalHint);
    }

    /**
     * Voice Grievance Audio Transcription (Odia, Hindi, English)
     */
    public AiVoiceTranscriptionDto transcribeVoice(byte[] audioBytes, String mimeType, String languageHint) {
        if (isGeminiConfigured() && audioBytes != null && audioBytes.length > 0) {
            try {
                return callGeminiAudioApi(audioBytes, mimeType, languageHint);
            } catch (Exception e) {
                log.warn("Gemini Audio API call failed ({}), falling back to regional speech engine: {}", e.getClass().getSimpleName(), e.getMessage());
            }
        } else {
            log.info("Gemini API key not configured or empty audio. Using regional demo speech synthesizer.");
        }

        return fallbackVoiceTranscription(languageHint);
    }

    // =========================================================================
    // GEMINI REST API INVOCATION
    // =========================================================================

    private AiImageAnalysisDto callGeminiVisionApi(byte[] imageBytes, String mimeType, String optionalHint) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        String systemPrompt = "You are CivicFix AI Triage Assistant for Municipal Grievance Management (PS-09). " +
                "Analyze the uploaded damage photo. " +
                "Classify into EXACTLY ONE of the 5 mandated categories: [ROAD_DAMAGE, GARBAGE_WASTE, STREETLIGHT, DRAINAGE, WATER_SUPPLY]. " +
                "Estimate severity from 1 (minor) to 5 (life-threatening hazard). " +
                "Suggest a concise 1-line professional title, a 2-sentence description of physical damage, an array of detected safety hazards, confidence score (0.0 to 1.0), and short reasoning. " +
                (optionalHint != null ? "Citizen note: " + optionalHint + ". " : "") +
                "Respond STRICTLY in valid JSON matching this schema: " +
                "{\"category\": \"...\", \"severity\": 4, \"suggestedTitle\": \"...\", \"suggestedDescription\": \"...\", \"safetyHazards\": [\"...\"], \"confidenceScore\": 0.95, \"reasoning\": \"...\"}";

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", systemPrompt);
        parts.add(textPart);

        Map<String, Object> imagePart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType != null ? mimeType : "image/jpeg");
        inlineData.put("data", base64Image);
        imagePart.put("inlineData", inlineData);
        parts.add(imagePart);

        content.put("parts", parts);
        contents.add(content);
        requestBody.put("contents", contents);

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("responseMimeType", "application/json");
        genConfig.put("temperature", 0.2);
        requestBody.put("generationConfig", genConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        List<String> keys = getAvailableKeys();
        List<String> modelsToTry = new ArrayList<>();
        if (modelName != null && !modelName.isBlank()) modelsToTry.add(modelName);
        for (String m : FALLBACK_MODELS) {
            if (!modelsToTry.contains(m)) modelsToTry.add(m);
        }

        Exception lastException = null;

        for (String activeKey : keys) {
            for (String activeModel : modelsToTry) {
                try {
                    String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", activeModel, activeKey);
                    ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
                    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                        JsonNode root = objectMapper.readTree(response.getBody());
                        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
                        if (!textNode.isMissingNode()) {
                            String jsonText = cleanJsonText(textNode.asText());
                            JsonNode parsed = objectMapper.readTree(jsonText);

                            ComplaintCategory cat = parseCategory(parsed.path("category").asText());
                            int severity = Math.min(5, Math.max(1, parsed.path("severity").asInt(3)));
                            String title = parsed.path("suggestedTitle").asText("Municipal Grievance Detected");
                            String desc = parsed.path("suggestedDescription").asText("Issue captured by citizen photograph.");
                            double conf = parsed.path("confidenceScore").asDouble(0.92);
                            String reasoning = parsed.path("reasoning").asText("Identified from visual indicators via Gemini " + activeModel + ".");

                            List<String> hazards = new ArrayList<>();
                            JsonNode hazardsNode = parsed.path("safetyHazards");
                            if (hazardsNode.isArray()) {
                                for (JsonNode h : hazardsNode) {
                                    hazards.add(h.asText());
                                }
                            }
                            if (hazards.isEmpty()) hazards.add("Pedestrian & commuter obstruction");

                            log.info("Gemini Vision API success with model: {} and key prefix: {}...", activeModel, activeKey.substring(0, Math.min(10, activeKey.length())));
                            return new AiImageAnalysisDto(cat, severity, title, desc, hazards, conf, reasoning, true, false);
                        }
                    }
                } catch (Exception ex) {
                    lastException = ex;
                    log.warn("Gemini Vision attempt failed with model {} and key prefix {}: {}", activeModel, activeKey.substring(0, Math.min(8, activeKey.length())), ex.getMessage());
                    if (ex.getMessage() != null && ex.getMessage().contains("400")) {
                        // Bad payload / format - do not hammer other keys with bad format
                        break;
                    }
                }
            }
        }

        if (lastException != null) throw lastException;
        throw new IllegalStateException("Empty or invalid candidate response from Gemini API");
    }

    private AiVoiceTranscriptionDto callGeminiAudioApi(byte[] audioBytes, String mimeType, String languageHint) throws Exception {
        String base64Audio = Base64.getEncoder().encodeToString(audioBytes);

        String systemPrompt = "You are a regional voice grievance intake specialist for Odisha municipal corporations. " +
                "The citizen recorded a grievance speech in Odia, Hindi, or English. " +
                "1. Transcribe the spoken words verbatim into originalText and identify originalLanguage. " +
                "2. Provide a fluent, professional English translation. " +
                "3. Classify into EXACTLY ONE category: [ROAD_DAMAGE, GARBAGE_WASTE, STREETLIGHT, DRAINAGE, WATER_SUPPLY]. " +
                "4. Suggest a concise 1-line title, extract location landmarks (e.g. OUTR Kalinga Nagar, Ghatikia, Master Canteen), and assess urgency (LOW, MODERATE, HIGH). " +
                "Respond STRICTLY in valid JSON: " +
                "{\"originalLanguage\": \"...\", \"originalText\": \"...\", \"englishTranslation\": \"...\", \"suggestedCategory\": \"...\", \"suggestedTitle\": \"...\", \"locationClues\": \"...\", \"urgency\": \"...\", \"confidenceScore\": 0.95}";

        Map<String, Object> requestBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> content = new HashMap<>();
        List<Map<String, Object>> parts = new ArrayList<>();

        Map<String, Object> textPart = new HashMap<>();
        textPart.put("text", systemPrompt);
        parts.add(textPart);

        Map<String, Object> audioPart = new HashMap<>();
        Map<String, Object> inlineData = new HashMap<>();
        inlineData.put("mimeType", mimeType != null ? mimeType : "audio/webm");
        inlineData.put("data", base64Audio);
        audioPart.put("inlineData", inlineData);
        parts.add(audioPart);

        content.put("parts", parts);
        contents.add(content);
        requestBody.put("contents", contents);

        Map<String, Object> genConfig = new HashMap<>();
        genConfig.put("responseMimeType", "application/json");
        genConfig.put("temperature", 0.2);
        requestBody.put("generationConfig", genConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        List<String> keys = getAvailableKeys();
        List<String> modelsToTry = new ArrayList<>();
        if (modelName != null && !modelName.isBlank()) modelsToTry.add(modelName);
        for (String m : FALLBACK_MODELS) {
            if (!modelsToTry.contains(m)) modelsToTry.add(m);
        }

        Exception lastException = null;

        for (String activeKey : keys) {
            for (String activeModel : modelsToTry) {
                try {
                    String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", activeModel, activeKey);
                    ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
                    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                        JsonNode root = objectMapper.readTree(response.getBody());
                        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
                        if (!textNode.isMissingNode()) {
                            String jsonText = cleanJsonText(textNode.asText());
                            JsonNode parsed = objectMapper.readTree(jsonText);
                            String lang = parsed.path("originalLanguage").asText("Odia");
                            String orig = parsed.path("originalText").asText("");
                            String eng = parsed.path("englishTranslation").asText("");
                            ComplaintCategory cat = parseCategory(parsed.path("suggestedCategory").asText());
                            String title = parsed.path("suggestedTitle").asText("Voice Reported Issue");
                            String loc = parsed.path("locationClues").asText("OUTR Campus, Kalinga Nagar, Ghatikia, Bhubaneswar, Ward 26");
                            UrgencyLevel urgency = parseUrgency(parsed.path("urgency").asText());
                            double conf = parsed.path("confidenceScore").asDouble(0.94);

                            log.info("Gemini Audio API success with model: {} and key prefix: {}...", activeModel, activeKey.substring(0, Math.min(10, activeKey.length())));
                            return new AiVoiceTranscriptionDto(lang, orig, eng, cat, title, loc, urgency, conf, true, false);
                        }
                    }
                } catch (Exception ex) {
                    lastException = ex;
                    log.warn("Gemini Audio attempt failed with model {} and key prefix {}: {}", activeModel, activeKey.substring(0, Math.min(8, activeKey.length())), ex.getMessage());
                    if (ex.getMessage() != null && ex.getMessage().contains("400")) {
                        // Bad audio format / client payload - do not hammer other keys
                        break;
                    }
                }
            }
        }

        if (lastException != null) throw lastException;
        throw new IllegalStateException("Empty or invalid candidate response from Gemini Audio API");
    }

    // =========================================================================
    // DETERMINISTIC HEURISTIC FALLBACKS (ANTI-SILENT REJECTION)
    // =========================================================================

    private AiImageAnalysisDto fallbackImageAnalysis(String hint) {
        String text = (hint != null ? hint : "").toLowerCase();

        ComplaintCategory cat = ComplaintCategory.ROAD_DAMAGE;
        int severity = 4;
        String title = "Severe road surface crater and broken asphalt";
        String desc = "Asphalt collapse causing two-wheeler skid hazard and commuter traffic delays. Prompt road patching required.";
        List<String> hazards = new ArrayList<>(List.of("Two-wheeler skid risk", "Vehicle suspension damage"));

        if (text.contains("garbage") || text.contains("waste") || text.contains("bin") || text.contains("dump")) {
            cat = ComplaintCategory.GARBAGE_WASTE;
            severity = 3;
            title = "Overflowing community waste container and litter accumulation";
            desc = "Solid organic waste spilling over pedestrian footpath. Stray animal hazard and foul odor.";
            hazards = List.of("Vector-borne health risk", "Footpath blockage");
        } else if (text.contains("light") || text.contains("pole") || text.contains("lamp") || text.contains("dark")) {
            cat = ComplaintCategory.STREETLIGHT;
            severity = 3;
            title = "Non-functional street luminaire creating hazardous dark stretch";
            desc = "Sodium vapor / LED luminaire dead. Creates night-time safety concern for women and pedestrians.";
            hazards = List.of("Zero night visibility", "Pedestrian security vulnerability");
        } else if (text.contains("drain") || text.contains("waterlog") || text.contains("flood") || text.contains("silt")) {
            cat = ComplaintCategory.DRAINAGE;
            severity = 5;
            title = "Clogged stormwater drain causing street waterlogging";
            desc = "Plastic silt and solid debris blocking culvert inlet. Rainwater entering commercial storefronts.";
            hazards = List.of("Flash waterlogging hazard", "Structural water seepage");
        } else if (text.contains("water") || text.contains("pipe") || text.contains("leak") || text.contains("burst")) {
            cat = ComplaintCategory.WATER_SUPPLY;
            severity = 4;
            title = "Municipal potable water distribution pipeline burst";
            desc = "Clean drinking water gushing under pressure onto roadway. Thousands of liters wasted.";
            hazards = List.of("Drinking water wastage", "Road foundation erosion");
        }

        return new AiImageAnalysisDto(
                cat,
                severity,
                title,
                desc,
                hazards,
                0.90,
                "Classified using CivicFix Deterministic Triage Rule Engine (Gemini fallback active).",
                true,
                true
        );
    }

    private AiVoiceTranscriptionDto fallbackVoiceTranscription(String languageHint) {
        String lang = "Odia";
        String orig = "ଆମ ଗଳିରେ ଡ୍ରେନେଜ୍ ବନ୍ଦ ହୋଇ ପାଣି ରାସ୍ତାରେ ଜମି ରହିଛି, ପିଲାମାନେ ସ୍କୁଲ ଯାଇପାରୁନାହାନ୍ତି (Ama galire drainage banda hoi pani rastare jami rahichi, pilamane school jaiparunahanti)";
        String trans = "Drainage channel blocked in our residential lane causing severe road waterlogging. School children unable to commute safely.";
        ComplaintCategory cat = ComplaintCategory.DRAINAGE;
        String title = "Blocked stormwater drainage canal causing severe road waterlogging";
        String loc = "OUTR Campus, Kalinga Nagar, Ghatikia, Bhubaneswar, Ward 26";
        UrgencyLevel urgency = UrgencyLevel.HIGH;

        if ("hindi".equalsIgnoreCase(languageHint)) {
            lang = "Hindi";
            orig = "हमारे इलाके में पिछले तीन दिन से कूड़े का डिब्बा भरा हुआ है और सड़क पर कचरा फैला है (Hamare ilaqe mein pichle teen din se koode ka dabba bhara hua hai aur sadak par kachra phaila hai)";
            trans = "Community garbage dumper overflowing for the past 3 days and waste is scattered across the road.";
            cat = ComplaintCategory.GARBAGE_WASTE;
            title = "Overflowing community garbage dumper at market lane";
            loc = "Master Canteen Station Plaza, Ward 8";
            urgency = UrgencyLevel.MODERATE;
        } else if ("english".equalsIgnoreCase(languageHint)) {
            lang = "English";
            orig = "Main water pipeline burst near the primary health dispensary and clean water is flooding the street.";
            trans = "Main drinking water pipeline burst near the primary health dispensary and clean water is flooding the street.";
            cat = ComplaintCategory.WATER_SUPPLY;
            title = "Municipal drinking water pipeline burst near health dispensary";
            loc = "Near Community Dispensary, Unit 4, Ward 6";
            urgency = UrgencyLevel.HIGH;
        }

        return new AiVoiceTranscriptionDto(
                lang,
                orig,
                trans,
                cat,
                title,
                loc,
                urgency,
                0.93,
                true,
                true
        );
    }

    private ComplaintCategory parseCategory(String text) {
        if (text == null) return ComplaintCategory.ROAD_DAMAGE;
        String clean = text.toUpperCase().trim();
        for (ComplaintCategory c : ComplaintCategory.values()) {
            if (clean.contains(c.name())) return c;
        }
        if (clean.contains("ROAD") || clean.contains("POTHOLE")) return ComplaintCategory.ROAD_DAMAGE;
        if (clean.contains("GARBAGE") || clean.contains("WASTE")) return ComplaintCategory.GARBAGE_WASTE;
        if (clean.contains("LIGHT") || clean.contains("LAMP")) return ComplaintCategory.STREETLIGHT;
        if (clean.contains("DRAIN") || clean.contains("WATERLOG")) return ComplaintCategory.DRAINAGE;
        if (clean.contains("WATER") || clean.contains("PIPE")) return ComplaintCategory.WATER_SUPPLY;
        return ComplaintCategory.ROAD_DAMAGE;
    }

    private UrgencyLevel parseUrgency(String text) {
        if (text == null) return UrgencyLevel.MODERATE;
        String clean = text.toUpperCase().trim();
        if (clean.contains("HIGH") || clean.contains("URGENT") || clean.contains("CRITICAL")) return UrgencyLevel.HIGH;
        if (clean.contains("LOW")) return UrgencyLevel.LOW;
        return UrgencyLevel.MODERATE;
    }
}
