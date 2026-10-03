package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ImplementationPlanRequest(
        @NotBlank String innovationId,
        @NotBlank String gminaId,
        @Size(max = 2000) String needs,
        @Size(max = 200) String budget,
        @Size(max = 200) String timeframe
) {}
