package com.example.backend.mapper;

import com.example.backend.dto.InnovationResponse;
import com.example.backend.model.Innovation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InnovationMapper {

    // MapStruct potrafi mapować z wielu źródeł naraz!
    // Bierzemy dane z encji Innovation, a pole matchScore z drugiego parametru.
    @Mapping(target = "matchScore", source = "score")
    InnovationResponse toResponse(Innovation innovation, Integer score);
}