package com.example.backend.controller;

import com.example.backend.dto.ParticipationRequest;
import com.example.backend.dto.ParticipationResponse;
import com.example.backend.dto.ReviewRequest;
import com.example.backend.dto.ReviewsResponse;
import com.example.backend.service.InnovationTestingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/testing/{innovationId}")
@RequiredArgsConstructor
public class TestingController {

    private final InnovationTestingService testingService;

    @PostMapping("/participation")
    @ResponseStatus(HttpStatus.CREATED)
    public ParticipationResponse joinTest(
            @PathVariable String innovationId,
            @Valid @RequestBody ParticipationRequest request) {
        return testingService.submitParticipation(innovationId, request);
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public void submitReview(
            @PathVariable String innovationId,
            @Valid @RequestBody ReviewRequest request) {
        testingService.submitReview(innovationId, request);
    }

    @GetMapping("/reviews")
    public ReviewsResponse getReviews(@PathVariable String innovationId) {
        return testingService.getReviews(innovationId);
    }
}