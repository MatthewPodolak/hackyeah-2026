package com.example.backend.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import com.example.backend.dto.ApplicationDraft;
import com.example.backend.dto.ApplicationRequest;
import com.example.backend.model.GrantCall;
import com.example.backend.service.GrantApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/grant-calls")
@RequiredArgsConstructor
public class GrantCallController {
    private final GrantApplicationService service;

    // public list: open calls first, then upcoming, then finished
    @GetMapping public List<GrantCall> all() { return service.allCalls(); }

    @GetMapping("/active") public List<GrantCall> active() { return service.activeCalls(); }

    @PostMapping("/{callId}/application")
    public ApplicationDraft generate(@PathVariable Long callId, @RequestBody ApplicationRequest r,
                                     @AuthenticationPrincipal Jwt jwt) throws Exception {
        return service.generate(callId, r, jwt == null ? null : Long.valueOf(jwt.getSubject()));
    }

}
