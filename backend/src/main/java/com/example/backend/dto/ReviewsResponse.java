package com.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ReviewsResponse(
        double averageRating,
        long totalReviews,
        List<ReviewItem> reviews
) {
    public record ReviewItem(
            Long id,
            String reviewerName,
            int rating,
            String comment,
            String improvementSuggestion,
            LocalDateTime createdAt
    ) {}
}