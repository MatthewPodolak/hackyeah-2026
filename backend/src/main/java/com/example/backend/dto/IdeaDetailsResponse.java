package com.example.backend.dto;

import java.util.Map;

public record IdeaDetailsResponse(
        IdeaResponse idea, Map<String, Object> canvas,
        AiFeedback feedback
) {
}
