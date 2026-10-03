package com.example.backend.dto;

import java.util.List;

public record AiFeedback(
        List<String> strengths,
        List<String> improvements,
        String readinessAssessment,
        String nextStep
) {
}
