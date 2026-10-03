package com.example.backend.controller;

import com.example.backend.dto.IdeaRequest;
import com.example.backend.dto.IdeaResponse;
import com.example.backend.service.IdeaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ideas")
@RequiredArgsConstructor
public class IdeaController {
    private final IdeaService ideaService;
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IdeaResponse submitIdea(@RequestBody IdeaRequest request) {
        return ideaService.submitIdea(request);
    }
}