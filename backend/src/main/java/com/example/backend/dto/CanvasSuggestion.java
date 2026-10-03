package com.example.backend.dto;

import java.util.Map;

public record CanvasSuggestion(
        Map<String, Object> answers,
        Map<String, String> reasons
) {
}
