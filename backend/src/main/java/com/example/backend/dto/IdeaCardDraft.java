package com.example.backend.dto;

import com.example.backend.model.Readiness;

import java.util.List;

public record IdeaCardDraft(
        String title,
        String essence,
        String problemDescription,
        List<String> whoCategories,
        List<String> disabilityTypes,
        Readiness readiness
) {
}
