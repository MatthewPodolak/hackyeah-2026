package com.example.backend.dto;

import java.util.List;

public record CoachRequest(
        String ideaToken, String message, List<ChatMessage> history
) {
}
