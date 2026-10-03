package com.example.backend.dto;

import java.time.Instant;

public record ProblemSummaryResponse(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude,
        Instant localDate,
        String street
) {}
