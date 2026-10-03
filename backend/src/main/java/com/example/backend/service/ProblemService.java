package com.example.backend.service;

import com.example.backend.dto.InnovationMatchResponse;
import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.dto.ProblemSummaryResponse;
import com.example.backend.dto.ProblemWithMatchesResponse;
import com.example.backend.mapper.ProblemMapper;
import com.example.backend.model.Problem;
import com.example.backend.model.ProblemCategory;
import com.example.backend.model.TargetGroup;
import com.example.backend.repository.AppUserRepository;
import com.example.backend.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProblemService {
    private final ProblemRepository problemRepository;
    private final ProblemMapper problemMapper;
    private final AppUserRepository appUserRepository;
    private final MatchmakingService matchmakingService;


    public ProblemWithMatchesResponse reportProblem(ProblemRequest request) {

        Problem problem = problemMapper.toEntity(request);
        if (request.authorId() != null) {
            appUserRepository.findById(request.authorId()).ifPresent(problem::setAuthor);
        }
        problem.setLocalDate(Instant.now());
        if (problem.getCategory() == null) {
            problem.setCategory(ProblemCategory.OTHER);
        }
        if (problem.getTargetGroup() == null) {
            problem.setTargetGroup(TargetGroup.OTHER);
        }
        Problem saved = problemRepository.save(problem);

        String text = request.title() + "\n" + request.description();
        List<InnovationMatchResponse> matches = matchmakingService.findMatches(text);

        return new ProblemWithMatchesResponse(problemMapper.toResponse(saved), matches);
    }

    public List<ProblemSummaryResponse> getProblems() {
        return problemRepository.findAllSummaries();
    }

    public ProblemResponse getProblem(Long id) {
        return problemRepository.findById(id)
                .map(problemMapper::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }
}
