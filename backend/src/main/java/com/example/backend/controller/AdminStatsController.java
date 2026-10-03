package com.example.backend.controller;

import com.example.backend.dto.AdminStatsResponse;
import com.example.backend.dto.StatsInsights;
import com.example.backend.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
public class AdminStatsController {

    private final StatsService statsService;

    @GetMapping
    public AdminStatsResponse stats(@RequestParam(required = false) String gminaId, @AuthenticationPrincipal Jwt jwt) {
        return statsService.stats(statsService.resolveScope(userId(jwt), gminaId));
    }

    @PostMapping("/insights")
    public StatsInsights insights(@RequestParam(required = false) String gminaId, @AuthenticationPrincipal Jwt jwt) {
        return statsService.insights(statsService.resolveScope(userId(jwt), gminaId));
    }

    private static Long userId(Jwt jwt) {
        return jwt == null ? null : Long.valueOf(jwt.getSubject());
    }
}
