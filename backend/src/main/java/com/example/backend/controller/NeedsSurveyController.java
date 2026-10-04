package com.example.backend.controller;

import com.example.backend.dto.NeedsSurveyDtos.Submit;
import com.example.backend.dto.NeedsSurveyDtos.Summary;
import com.example.backend.service.NeedsSurveyService;
import com.example.backend.service.StatsService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class NeedsSurveyController {

    private final NeedsSurveyService service;
    private final StatsService stats;

    @PostMapping("/surveys/needs")
    @ResponseStatus(HttpStatus.CREATED)
    public void submit(@RequestBody Submit body, HttpServletRequest request) {
        service.submit(body, request.getRemoteAddr());
    }

    @GetMapping("/admin/surveys/needs")
    public Summary summary(@RequestParam(required = false) String gminaId, @AuthenticationPrincipal Jwt jwt) {
        return service.summary(stats.resolveScope(jwt == null ? null : Long.valueOf(jwt.getSubject()), gminaId));
    }
}
