package com.example.backend.service;

import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.dto.ProblemSummaryResponse;
import com.example.backend.mapper.ProblemMapper;
import com.example.backend.model.Problem;
import com.example.backend.repository.AppUserRepository;
import com.example.backend.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProblemService {
    private final ProblemRepository problemRepository;
    private final ProblemMapper problemMapper;
    private final AppUserRepository appUserRepository;

    public ProblemResponse reportProblem(ProblemRequest request) {
        Problem problem = problemMapper.toEntity(request);
        if (request.authorId() != null) {
            appUserRepository.findById(request.authorId()).ifPresent(problem::setAuthor);
            
        }
        Problem savedProblem = problemRepository.save(problem);
        return problemMapper.toResponse(savedProblem);
    }

    public List<ProblemSummaryResponse> getProblems() {
        return problemRepository.findAllSummaries();
    }
}
