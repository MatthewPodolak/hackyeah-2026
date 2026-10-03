package com.example.backend.dto;

import com.example.backend.model.AccountStatus;
import com.example.backend.model.Role;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        AccountStatus accountStatus
) {}
