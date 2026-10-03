package com.example.backend.dto;

public record ProblemSummaryResponse(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude
) {}
