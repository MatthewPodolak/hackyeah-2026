package com.example.backend.dto;

import java.util.List;

public record ApplicationDraft(List<Section> sections) {
    // fillBy (AI_DRAFT / USER / USER_CONFIRM) comes from the call's real form, null for calls typed in by ROPS
    public record Section(String title, String content, String fillBy) {
    }
}
