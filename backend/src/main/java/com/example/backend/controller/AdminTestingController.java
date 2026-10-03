package com.example.backend.controller;

import com.example.backend.dto.ParticipationResponse;
import com.example.backend.dto.ParticipationStatusUpdateRequest;
import com.example.backend.service.InnovationTestingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/testing")
@RequiredArgsConstructor
public class AdminTestingController {

    private final InnovationTestingService testingService;

    @GetMapping("/participations")
    public List<ParticipationResponse> listParticipations(@RequestParam(required = false) String status) {
        return testingService.getAllParticipations(status);
    }

    @PatchMapping("/participations/{id}/status")
    public ParticipationResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ParticipationStatusUpdateRequest request) {
        return testingService.updateParticipationStatus(id, request.status());
    }
}
