package com.example.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StatsInsights(String summary, List<String> trends, List<String> recommendations) {}
