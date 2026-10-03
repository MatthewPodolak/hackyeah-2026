package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ImplementationPlan(
        String title,
        String summary,
        String serviceModel,
        String localContext,
        List<Step> steps,
        List<Partner> partners,
        List<Cost> costs,
        List<Risk> risks,
        List<String> indicators,
        List<String> fundingSources,
        Context context
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Step(String phase, String title, String description, String duration, String responsible) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Partner(String name, String role) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Cost(String item, String estimate) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Risk(String risk, String mitigation) {}

    public record Context(String innovationId, String innovationName, String gminaId, String gminaLabel,
                          String powiatLabel, Integer population, Double urbanizationPct, String gminaType) {}
}
