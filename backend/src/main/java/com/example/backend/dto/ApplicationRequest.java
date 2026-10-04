package com.example.backend.dto;

import java.util.List;

public record ApplicationRequest(
        String ideaToken,
        String extraInfo,
        // positions in the applicant's saved team who work on this project
        List<Integer> teamMemberIndexes
) {
}
