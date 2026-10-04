package com.example.backend.dto;

import com.example.backend.dto.AdminStatsResponse.Bucket;
import com.example.backend.model.NeedsSurveyResponse.AgeGroup;
import com.example.backend.model.NeedsSurveyResponse.Loneliness;

import java.util.List;

public final class NeedsSurveyDtos {

    private NeedsSurveyDtos() {}

    public record Submit(List<String> priorities, Integer serviceAccess, Loneliness loneliness, AgeGroup ageGroup, String gminaId) {}

    public record Summary(long total, long last30Days, Double averageAccess,
                          List<Bucket> priorities, List<Bucket> serviceAccess, List<Bucket> loneliness, List<Bucket> ageGroups) {}
}
