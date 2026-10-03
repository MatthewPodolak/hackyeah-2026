package com.example.backend.dto;

import java.time.Instant;

public record ProblemRequest(
        String title,
        String description,
        Double latitude,
        Double longitude,
        String imageUrl,
        Long authorId,
        String street
) {}