package com.example.backend.controller;

import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.dto.ProblemSummaryResponse;
import com.example.backend.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProblemResponse createProblem(@RequestBody ProblemRequest request) {
        return problemService.reportProblem(request);
    }

    @GetMapping("/get-problems")
    public List<ProblemSummaryResponse> getProblems() {
        return problemService.getProblems();
    }
}
