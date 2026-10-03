package com.example.backend.dto;

import com.example.backend.mapper.IdeaStatus;
import com.example.backend.model.Readiness;

import java.time.LocalDateTime;
import java.util.List;

public record IdeaResponse(
        Long id,
        String trackingToken,
        String title,
        String essence,
        String problemDescription,
        List<String> whoCategories,
        List<String> disabilityTypes,
        Readiness readiness,
        String gminaId,
        Long sourceProblemId,
        IdeaStatus status,
        String adminReply,
        boolean hasCanvas,
        boolean hasFeedback,
        boolean publishConsent,
        boolean hasVisualization,
        String visualizationAlt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}