package com.example.backend.mapper;

import com.example.backend.dto.IdeaRequest;
import com.example.backend.dto.IdeaResponse;
import com.example.backend.model.Idea;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface IdeaMapper {

    // Ignorujemy id, status i relację do autora podczas mapowania z Requestu,
    // ponieważ te pola ustawiamy ręcznie w logice biznesowej.
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "author", ignore = true)
    Idea toEntity(IdeaRequest request);

    IdeaResponse toResponse(Idea idea);
}