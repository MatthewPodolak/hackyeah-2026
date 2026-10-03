package com.example.backend.dto;

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
        String street

) {}