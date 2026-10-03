package com.example.backend.dto;

import com.example.backend.model.ProblemCategory;
import com.example.backend.model.ProblemStatus;
import com.example.backend.model.TargetGroup;

import java.time.Instant;
import java.time.LocalDate;

public record ProblemResponse(
        Long id,
        String title,
        String description,
        Double latitude,
        Double longitude,
        String imageUrl,
        Instant localDate,
        String street,
        ProblemCategory category,
        TargetGroup targetGroup,
        ProblemStatus status
) {}