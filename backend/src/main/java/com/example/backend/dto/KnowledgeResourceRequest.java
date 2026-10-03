package com.example.backend.dto;

import com.example.backend.model.ResourceType;

public record KnowledgeResourceRequest(String title, String description, ResourceType type, String url, String challengeArea) {}
