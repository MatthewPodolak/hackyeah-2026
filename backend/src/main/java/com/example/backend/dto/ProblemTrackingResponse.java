package com.example.backend.dto;

import java.time.Instant;

public record ProblemTrackingResponse(
        ProblemResponse problem,
        String trackingToken,
        String adminReply,
        Instant updatedAt,
        boolean adminSeen,
        String authorName
) {}
