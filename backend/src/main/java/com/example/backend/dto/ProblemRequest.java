package com.example.backend.dto;

public record ProblemRequest(
        String title,
        String description,
        Double latitude,
        Double longitude,
        String imageUrl,
        Long authorId
) {}