package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ParticipationStatusUpdateRequest(
        @NotBlank
        @Pattern(regexp = "ACCEPTED|REJECTED|PENDING", message = "Dopuszczalne statusy: ACCEPTED, REJECTED, PENDING")
        String status
) {}