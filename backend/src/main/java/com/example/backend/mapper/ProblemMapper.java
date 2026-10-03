package com.example.backend.mapper;

import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.model.Problem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProblemMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "author", ignore = true) // Autora ustawimy w serwisie
    @Mapping(target = "powiatId", ignore = true)
    Problem toEntity(ProblemRequest request);

    ProblemResponse toResponse(Problem problem);
}