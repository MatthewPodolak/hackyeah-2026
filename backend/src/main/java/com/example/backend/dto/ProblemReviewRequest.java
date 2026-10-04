package com.example.backend.dto;

import com.example.backend.model.ProblemPriority;
import com.example.backend.model.ProblemStatus;

public record ProblemReviewRequest(ProblemStatus status, String reply, ProblemPriority priority) {}
