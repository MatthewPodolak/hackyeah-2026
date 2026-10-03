package com.example.backend.service;

import com.example.backend.dto.InnovationResponse;
import com.example.backend.dto.MatchmakingRequest;
import com.example.backend.model.Innovation;
import com.example.backend.mapper.InnovationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchmakingService {

    private final InnovationMapper innovationMapper;

    public List<InnovationResponse> findMatches(MatchmakingRequest request) {
        Innovation inno1 = new Innovation(1L, "Koperta Życia", "Pomoc medyczna dla seniorów.", "Kluczowe", "Wdrożone");
        Innovation inno2 = new Innovation(2L, "Apka Sąsiad", "Łączy wolontariuszy z seniorami.", "Kluczowe", "Prototyp");

        return List.of(
                innovationMapper.toResponse(inno1, 95),
                innovationMapper.toResponse(inno2, 78)
        );
    }
}