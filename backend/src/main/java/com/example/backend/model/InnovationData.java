package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record InnovationData(
        String id,
        String name,
        String shortDescription,
        String description,
        String problem,
        List<String> targetGroups,
        List<String> challengeAreas,
        List<String> problemTags,
        String targetGroupDescription,
        String whoCanImplement,
        String effectiveness,
        String disseminationProgram,
        Map<String, String> links
) {}