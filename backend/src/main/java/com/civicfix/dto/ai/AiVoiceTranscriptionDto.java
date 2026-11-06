package com.civicfix.dto.ai;

import com.civicfix.model.enums.ComplaintCategory;
import com.civicfix.model.enums.UrgencyLevel;

/**
 * AiVoiceTranscriptionDto - Output of Gemini Multilingual Audio Speech Processing
 * Transcribes regional speech (Odia, Hindi, English), translates to English,
 * and extracts structured grievance fields.
 */
public class AiVoiceTranscriptionDto {

    private String originalLanguage; // "Odia", "Hindi", "English"
    private String originalText;
    private String englishTranslation;
    private ComplaintCategory suggestedCategory;
    private String suggestedTitle;
    private String locationClues;
    private UrgencyLevel urgency;
    private double confidenceScore;
    private boolean isAiAssisted;
    private boolean isFallback;

    public AiVoiceTranscriptionDto() {}

    public AiVoiceTranscriptionDto(
            String originalLanguage,
            String originalText,
            String englishTranslation,
            ComplaintCategory suggestedCategory,
            String suggestedTitle,
            String locationClues,
            UrgencyLevel urgency,
            double confidenceScore,
            boolean isAiAssisted,
            boolean isFallback
    ) {
        this.originalLanguage = originalLanguage;
        this.originalText = originalText;
        this.englishTranslation = englishTranslation;
        this.suggestedCategory = suggestedCategory;
        this.suggestedTitle = suggestedTitle;
        this.locationClues = locationClues;
        this.urgency = urgency;
        this.confidenceScore = confidenceScore;
        this.isAiAssisted = isAiAssisted;
        this.isFallback = isFallback;
    }

    public String getOriginalLanguage() { return originalLanguage; }
    public void setOriginalLanguage(String originalLanguage) { this.originalLanguage = originalLanguage; }

    public String getOriginalText() { return originalText; }
    public void setOriginalText(String originalText) { this.originalText = originalText; }

    public String getEnglishTranslation() { return englishTranslation; }
    public void setEnglishTranslation(String englishTranslation) { this.englishTranslation = englishTranslation; }

    public ComplaintCategory getSuggestedCategory() { return suggestedCategory; }
    public void setSuggestedCategory(ComplaintCategory suggestedCategory) { this.suggestedCategory = suggestedCategory; }

    public String getSuggestedTitle() { return suggestedTitle; }
    public void setSuggestedTitle(String suggestedTitle) { this.suggestedTitle = suggestedTitle; }

    public String getLocationClues() { return locationClues; }
    public void setLocationClues(String locationClues) { this.locationClues = locationClues; }

    public UrgencyLevel getUrgency() { return urgency; }
    public void setUrgency(UrgencyLevel urgency) { this.urgency = urgency; }

    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }

    public boolean isAiAssisted() { return isAiAssisted; }
    public void setAiAssisted(boolean aiAssisted) { isAiAssisted = aiAssisted; }

    public boolean isFallback() { return isFallback; }
    public void setFallback(boolean fallback) { isFallback = fallback; }
}
