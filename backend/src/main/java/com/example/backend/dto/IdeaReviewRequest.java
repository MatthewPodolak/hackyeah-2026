package com.example.backend.dto;

import com.example.backend.mapper.IdeaStatus;

public record IdeaReviewRequest(
        IdeaStatus status,
        String reply
) {
}
