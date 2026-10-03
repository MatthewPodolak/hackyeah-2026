package com.example.backend.dto;

public record InnovationMatchResponse(
        String id,
        String name,
        String shortDescription,
        String whoCanImplement,
        String effectiveness,
        String detailsUrl,
        int score,        // 0-100 od modelu
        String reason
) {
}
