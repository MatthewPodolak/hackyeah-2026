package com.example.backend.dto;

import com.example.backend.model.Readiness;

import java.util.List;

public record PublicIdeaResponse(
        Long id,
        String title,
        String essence,
        String problemDescription,
        List<String> whoCategories,
        Readiness readiness
) {
}
