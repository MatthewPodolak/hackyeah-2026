package com.example.backend.controller;

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

    @GetMapping("/active") public List<GrantCall> active() { return service.activeCalls(); }

    @PostMapping("/{callId}/application")
    public ApplicationDraft generate(@PathVariable Long callId, @RequestBody ApplicationRequest r) throws Exception {
        return service.generate(callId, r);
    }

}
