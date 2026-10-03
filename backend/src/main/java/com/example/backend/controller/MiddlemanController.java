package com.example.backend.controller;

import com.example.backend.dto.ImplementationPlan;
import com.example.backend.dto.ImplementationPlanRequest;
import com.example.backend.service.MiddlemanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/middleman")
@RequiredArgsConstructor
public class MiddlemanController {

    private final MiddlemanService middlemanService;

    @PostMapping("/plan")
    public ImplementationPlan plan(@Valid @RequestBody ImplementationPlanRequest request) {
        return middlemanService.plan(request);
    }
}
