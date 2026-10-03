package com.example.backend.dto;

public record InnovationResponse(
        Long id,
        String title,
        String description,
        String implementationStage,
        Integer matchScore // To pole wypełnimy w serwisie, bo nie ma go w bazie
) {}