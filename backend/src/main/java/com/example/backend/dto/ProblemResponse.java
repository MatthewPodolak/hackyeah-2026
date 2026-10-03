package com.example.backend.dto;

public record ProblemResponse(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude,
        String imageUrl
) {}