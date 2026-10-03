package com.example.backend.dto;

public record IdeaResponse(
        Long id,
        String title,
        String problemDescription,
        String targetGroup,
        String status
) {}