package com.example.backend.model;

public enum ProblemStatus {
    SUBMITTED,
    // decided by the JST of the gmina: accepted and passed on to ROPS, or declined with a reason
    FORWARDED,
    GMINA_REJECTED,
    IN_REVIEW,
    IN_PROGRESS,
    RESOLVED,
    REJECTED
}
