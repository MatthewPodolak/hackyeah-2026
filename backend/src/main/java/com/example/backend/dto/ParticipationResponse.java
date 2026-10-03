package com.example.backend.dto;

import java.time.LocalDateTime;

public record ParticipationResponse(
        Long id,
        String innovationId,
        Long userId,
        String contactName,
        String contactEmail,
        String contactPhone,
        String motivation,
        String status,
        LocalDateTime createdAt
) {}