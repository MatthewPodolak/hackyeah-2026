package com.example.backend.controller;

import com.example.backend.dto.InnovationMatchResponse;
import com.example.backend.dto.InnovationResponse;
import com.example.backend.dto.MatchmakingRequest;
import com.example.backend.service.MatchmakingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/matchmaking")
@RequiredArgsConstructor
public class MatchmakingController {

    private final MatchmakingService matchmakingService;

    @PostMapping
    public List<InnovationMatchResponse> match(@RequestBody MatchmakingRequest request) {
        return matchmakingService.findMatches(request.problemDescription());
    }
}