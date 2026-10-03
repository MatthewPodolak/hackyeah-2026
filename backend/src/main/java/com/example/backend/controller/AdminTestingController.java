package com.example.backend.controller;

import com.example.backend.dto.ParticipationResponse;
import com.example.backend.dto.ParticipationStatusUpdateRequest;
import com.example.backend.service.InnovationTestingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/testing")
@RequiredArgsConstructor
public class AdminTestingController {

    private final InnovationTestingService testingService;

    @Value("${admin.secret-key:moj-tajny-klucz}")
    private String adminSecretKey;

    private void requireAdmin(String key) {
        if (key == null || !key.equals(adminSecretKey)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak uprawnień administratora ROPS");
        }
    }

    @GetMapping("/participations")
    public List<ParticipationResponse> listParticipations(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestParam(required = false) String status) {
        requireAdmin(key);
        return testingService.getAllParticipations(status);
    }

    @PatchMapping("/participations/{id}/status")
    public ParticipationResponse updateStatus(
            @PathVariable Long id,
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @Valid @RequestBody ParticipationStatusUpdateRequest request) {
        requireAdmin(key);
        return testingService.updateParticipationStatus(id, request.status());
    }
}