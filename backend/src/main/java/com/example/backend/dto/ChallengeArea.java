package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ChallengeArea(
        String id, String name, String definition,
        List<String> keyChallenges, String persona
) {
}
