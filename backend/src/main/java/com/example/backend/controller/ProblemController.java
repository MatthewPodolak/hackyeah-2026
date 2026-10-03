package com.example.backend.controller;

import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemWithMatchesResponse;
import com.example.backend.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProblemWithMatchesResponse createProblem(@RequestBody ProblemRequest request) {
        return problemService.reportProblem(request);
    }
}