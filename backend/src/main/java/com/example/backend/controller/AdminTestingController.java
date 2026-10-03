package com.example.backend.controller;

import com.example.backend.config.RopsGuard;
import com.example.backend.dto.ParticipationResponse;
import com.example.backend.dto.ParticipationStatusUpdateRequest;
import com.example.backend.service.InnovationTestingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/testing")
@RequiredArgsConstructor
public class AdminTestingController {

    private final InnovationTestingService testingService;
    private final RopsGuard ropsGuard;

    @GetMapping("/participations")
    public List<ParticipationResponse> listParticipations(@RequestParam(required = false) String status, HttpServletRequest request) {
        ropsGuard.require(request);
        return testingService.getAllParticipations(status);
    }

    @PatchMapping("/participations/{id}/status")
    public ParticipationResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ParticipationStatusUpdateRequest body,
            HttpServletRequest request) {
        ropsGuard.require(request);
        return testingService.updateParticipationStatus(id, body.status());
    }
}
