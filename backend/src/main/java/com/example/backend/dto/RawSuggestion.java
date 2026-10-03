package com.example.backend.dto;

import java.util.Map;

public record RawSuggestion(
        Map<String, Object> answers, Map<String, Object> reasons
) {
}
