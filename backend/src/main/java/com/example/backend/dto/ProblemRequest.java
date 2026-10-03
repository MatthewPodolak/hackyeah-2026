package com.example.backend.dto;

import com.example.backend.model.ProblemCategory;
import com.example.backend.model.TargetGroup;

import java.time.Instant;

public record ProblemRequest(
        String title,
        String description,
        Double latitude,
        Double longitude,
        String imageUrl,
        Long authorId,
        String street,
        ProblemCategory category,
        TargetGroup targetGroup
) {}