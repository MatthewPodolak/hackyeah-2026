package com.example.backend.dto;

import com.example.backend.model.ProblemCategory;
import com.example.backend.model.TargetGroup;

import java.time.Instant;

public record ProblemSummaryResponse(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude,
        Instant localDate,
        String street,
        ProblemCategory category,
        TargetGroup targetGroup
) {}
