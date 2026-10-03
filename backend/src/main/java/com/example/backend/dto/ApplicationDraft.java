package com.example.backend.dto;

import java.util.List;

public record ApplicationDraft(List<Section> sections) {
    public record Section(String title, String content) {
    }
}
