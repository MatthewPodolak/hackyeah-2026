package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FormCategories(Map<String, WhoCategory> whoCategories, Map<String, String> disabilityTypes,
                             Map<String, ProblemCategory> problemCategories) {
    public record WhoCategory(String label, String icon) {}
    public record ProblemCategory(String label, String icon, String example, List<String> tags) {}
}
