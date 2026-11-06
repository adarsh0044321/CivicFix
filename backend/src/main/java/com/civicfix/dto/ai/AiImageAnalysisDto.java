package com.civicfix.dto.ai;

import com.civicfix.model.enums.ComplaintCategory;
import java.util.List;

/**
 * AiImageAnalysisDto - Output of Gemini 1.5/2.5 Flash Multimodal Vision Analysis
 */
public class AiImageAnalysisDto {

    private ComplaintCategory category;
    private int severity; // 1 to 5
    private String suggestedTitle;
    private String suggestedDescription;
    private List<String> safetyHazards;
    private double confidenceScore;
    private String reasoning;
    private boolean isAiAssisted;
    private boolean isFallback;

    public AiImageAnalysisDto() {}

    public AiImageAnalysisDto(
            ComplaintCategory category,
            int severity,
            String suggestedTitle,
            String suggestedDescription,
            List<String> safetyHazards,
            double confidenceScore,
            String reasoning,
            boolean isAiAssisted,
            boolean isFallback
    ) {
        this.category = category;
        this.severity = severity;
        this.suggestedTitle = suggestedTitle;
        this.suggestedDescription = suggestedDescription;
        this.safetyHazards = safetyHazards;
        this.confidenceScore = confidenceScore;
        this.reasoning = reasoning;
        this.isAiAssisted = isAiAssisted;
        this.isFallback = isFallback;
    }

    public ComplaintCategory getCategory() { return category; }
    public void setCategory(ComplaintCategory category) { this.category = category; }

    public int getSeverity() { return severity; }
    public void setSeverity(int severity) { this.severity = severity; }

    public String getSuggestedTitle() { return suggestedTitle; }
    public void setSuggestedTitle(String suggestedTitle) { this.suggestedTitle = suggestedTitle; }

    public String getSuggestedDescription() { return suggestedDescription; }
    public void setSuggestedDescription(String suggestedDescription) { this.suggestedDescription = suggestedDescription; }

    public List<String> getSafetyHazards() { return safetyHazards; }
    public void setSafetyHazards(List<String> safetyHazards) { this.safetyHazards = safetyHazards; }

    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getReasoning() { return reasoning; }
    public void setReasoning(String reasoning) { this.reasoning = reasoning; }

    public boolean isAiAssisted() { return isAiAssisted; }
    public void setAiAssisted(boolean aiAssisted) { isAiAssisted = aiAssisted; }

    public boolean isFallback() { return isFallback; }
    public void setFallback(boolean fallback) { isFallback = fallback; }
}
