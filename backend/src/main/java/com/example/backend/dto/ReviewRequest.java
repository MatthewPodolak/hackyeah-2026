package com.example.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReviewRequest(
        Long userId,
        @Size(max = 100) String reviewerName,
        @Min(1) @Max(5) int rating,
        @NotBlank @Size(max = 2000) String comment,
        @Size(max = 2000) String improvementSuggestion
) {}