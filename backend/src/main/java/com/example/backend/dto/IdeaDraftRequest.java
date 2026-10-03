package com.example.backend.dto;

public record IdeaDraftRequest(
        String text,
        Long sourceProblemId
) {
}
