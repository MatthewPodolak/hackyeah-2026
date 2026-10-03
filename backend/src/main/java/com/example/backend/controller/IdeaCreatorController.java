package com.example.backend.controller;

import com.example.backend.dto.*;
import com.example.backend.service.IdeaCreatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ideas")
@RequiredArgsConstructor
public class IdeaCreatorController {

    private final IdeaCreatorService service;

    @PostMapping("/draft")                                   // poziom 1, krok 2: AI robi szkic (nic nie zapisuje)
    public IdeaCardDraft draft(@RequestBody IdeaDraftRequest r) { return service.draftCard(r); }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)         // poziom 1, krok 4: wysłanie do Hubu
    public IdeaResponse submit(@RequestBody IdeaCardRequest r, @AuthenticationPrincipal Jwt jwt) {
        return service.submit(r, jwt == null ? null : Long.valueOf(jwt.getSubject()));
    }

    @GetMapping                                              // galeria zaakceptowanych pomysłów (dobre praktyki)
    public List<PublicIdeaResponse> gallery() { return service.gallery(); }

    @GetMapping("/by-token/{token}")
    public IdeaDetailsResponse mine(@PathVariable String token) { return service.getByToken(token); }

    @PutMapping("/by-token/{token}")
    public IdeaResponse update(@PathVariable String token, @RequestBody IdeaCardRequest r) { return service.updateCard(token, r); }

    @PutMapping("/by-token/{token}/canvas")
    public IdeaDetailsResponse saveCanvas(@PathVariable String token, @RequestBody CanvasAnswers body) { return service.saveCanvas(token, body); }

    @PostMapping("/by-token/{token}/canvas/suggest")         // ✨ Podpowiedz (krok opcjonalny)
    public CanvasSuggestion suggest(@PathVariable String token, @RequestParam(required = false) String step) { return service.suggestCanvas(token, step); }

    @PostMapping("/by-token/{token}/feedback")
    public AiFeedback feedback(@PathVariable String token) { return service.feedback(token); }

    @PostMapping("/by-token/{token}/visualize")
    public VisualizeResponse visualize(@PathVariable String token, @RequestBody(required = false) VisualizeRequest r) {
        return service.visualize(token, r);
    }

    @GetMapping("/by-token/{token}/visualization")
    public ResponseEntity<byte[]> visualization(@PathVariable String token) {
        return ImageResponses.from(service.visualizationByToken(token));
    }

    @GetMapping("/by-token/{token}/similar")
    public List<InnovationMatchResponse> similar(@PathVariable String token) { return service.similar(token); }
}
