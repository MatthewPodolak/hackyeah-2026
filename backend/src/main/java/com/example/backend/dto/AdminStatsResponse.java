package com.example.backend.dto;

import java.util.List;
import java.util.Map;

public record AdminStatsResponse(
        Map<String, Long> totals,
        List<Bucket> problemsByCategory,
        List<Bucket> problemsByTargetGroup,
        List<Bucket> problemsByStatus,
        List<Bucket> problemsByMonth,
        List<Bucket> ideasByStatus,
        List<Bucket> ideasByReadiness,
        List<Bucket> ideasByWho,
        List<TestedInnovation> mostWantedInnovations
) {
    public record Bucket(String key, long count) {}

    public record TestedInnovation(String id, String name, long participations, long reviews, double averageRating) {}
}
