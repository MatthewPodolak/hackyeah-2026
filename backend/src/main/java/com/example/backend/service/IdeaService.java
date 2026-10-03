package com.example.backend.service;

import com.example.backend.dto.IdeaRequest;
import com.example.backend.dto.IdeaResponse;
import com.example.backend.mapper.IdeaMapper;
import com.example.backend.model.Idea;
import com.example.backend.repository.IdeaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class IdeaService {

    private final IdeaRepository ideaRepository;
    private final IdeaMapper ideaMapper;

    public IdeaResponse submitIdea(IdeaRequest request) {
        // 1. Mapowanie z DTO na Encję
        Idea idea = ideaMapper.toEntity(request);

        // 2. Ustawienie brakujących danych biznesowych
        idea.setStatus("SUBMITTED");
        // (Docelowo tutaj dodasz też szukanie AppUser po request.authorId() i ustawienie authora)

        // 3. Zapis i mapowanie zwrotne Encji na DTO
        Idea savedIdea = ideaRepository.save(idea);
        return ideaMapper.toResponse(savedIdea);
    }
}