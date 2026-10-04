package com.example.backend.dto;

import com.example.backend.model.ProblemPriority;

import java.time.Instant;

public record ProblemTrackingResponse(
        ProblemResponse problem,
        String trackingToken,
        String adminReply,
        Instant updatedAt,
        boolean adminSeen,
        String authorName,
        ProblemPriority priority,
        String gminaNote,
        Instant gminaDecidedAt
) {}
