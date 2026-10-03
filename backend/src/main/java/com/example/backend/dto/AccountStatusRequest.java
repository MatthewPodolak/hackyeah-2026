package com.example.backend.dto;

import com.example.backend.model.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record AccountStatusRequest(@NotNull AccountStatus status) {}
