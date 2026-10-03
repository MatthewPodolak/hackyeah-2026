package com.example.backend.dto;

public record IdeaRequest(
        String title,
        String problemDescription,
        String targetGroup,
        Long authorId) {}