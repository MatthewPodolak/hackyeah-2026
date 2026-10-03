package com.example.backend.dto;

import java.util.List;

public record ProblemWithMatchesResponse(
        ProblemResponse problem,
        List<InnovationMatchResponse> matches
) {
}
