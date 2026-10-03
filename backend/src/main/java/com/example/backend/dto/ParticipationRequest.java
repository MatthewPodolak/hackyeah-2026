package com.example.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ParticipationRequest(
        Long userId,
        @Size(max = 120) String contactName,
        @Email @Size(max = 160) String contactEmail,
        @Size(max = 30) String contactPhone,
        @NotBlank @Size(max = 2000) String motivation
) {}