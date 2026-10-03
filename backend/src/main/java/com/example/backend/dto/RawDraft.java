package com.example.backend.dto;

import java.util.List;

public record RawDraft(
        String title, String essence, String problemDescription,
        List<String> whoCategories, List<String> disabilityTypes, String readiness
) {
}
