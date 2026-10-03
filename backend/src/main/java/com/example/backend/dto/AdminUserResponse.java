package com.example.backend.dto;

import com.example.backend.model.AccountStatus;
import com.example.backend.model.Role;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        Role role,
        AccountStatus accountStatus,
        Instant createdAt
) {}
