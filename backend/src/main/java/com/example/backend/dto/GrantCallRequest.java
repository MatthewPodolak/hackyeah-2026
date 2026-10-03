package com.example.backend.dto;

import java.time.LocalDate;

public record GrantCallRequest(
        String name,
        String description,
        LocalDate openFrom,
        LocalDate openTo,
        String requiredSections
) {}
