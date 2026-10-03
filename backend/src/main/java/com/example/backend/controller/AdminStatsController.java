package com.example.backend.controller;

import com.example.backend.dto.AdminStatsResponse;
import com.example.backend.dto.StatsInsights;
import com.example.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final StatsService statsService;

    @GetMapping
    public AdminStatsResponse stats() {
        return statsService.stats();
    }

    @PostMapping("/insights")
    public StatsInsights insights() {
        return statsService.insights();
    }
}
