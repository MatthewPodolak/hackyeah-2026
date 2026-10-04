package com.example.backend.dto;

import com.example.backend.model.ProblemPriority;

// accept = true needs a priority, accept = false needs a note (the reason shown to the resident)
public record GminaDecisionRequest(Boolean accept, ProblemPriority priority, String note) {}
