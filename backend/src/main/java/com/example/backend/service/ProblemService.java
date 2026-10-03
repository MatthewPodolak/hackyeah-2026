package com.example.backend.service;

import com.example.backend.config.CreatorReferenceData;
import com.example.backend.dto.InnovationMatchResponse;
import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.dto.ProblemSummaryResponse;
import com.example.backend.dto.ProblemWithMatchesResponse;
import com.example.backend.mapper.ProblemMapper;
import com.example.backend.model.AppUser;
import com.example.backend.dto.ProblemReviewRequest;
import com.example.backend.dto.ProblemTrackingResponse;
import com.example.backend.model.Problem;
import com.example.backend.model.ProblemStatus;
import com.example.backend.model.ProblemCategory;
import com.example.backend.model.TargetGroup;
import com.example.backend.repository.AppUserRepository;
import com.example.backend.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProblemService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final ProblemRepository problemRepository;
    private final ProblemMapper problemMapper;
    private final AppUserRepository appUserRepository;
    private final MatchmakingService matchmakingService;
    private final CreatorReferenceData referenceData;


    public ProblemWithMatchesResponse reportProblem(ProblemRequest request, Long authorId) {

        Problem problem = problemMapper.toEntity(request);
        if (authorId != null) {
            appUserRepository.findById(authorId).ifPresent(problem::setAuthor);
        }
        problem.setLocalDate(Instant.now());
        problem.setUpdatedAt(problem.getLocalDate());
        problem.setTrackingToken(newToken());
        problem.setStatus(ProblemStatus.SUBMITTED);
        problem.setAdminSeen(false);
        if (problem.getCategory() == null) {
            problem.setCategory(ProblemCategory.OTHER);
        }
        if (problem.getTargetGroup() == null) {
            problem.setTargetGroup(TargetGroup.OTHER);
        }
        if (!referenceData.gminaExists(request.gminaId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wybierz gminę w Małopolsce");
        }
        problem.setPowiatId(referenceData.powiatOf(request.gminaId()));
        problem.setWholeGmina(Boolean.TRUE.equals(request.wholeGmina()));
        if (problem.getWholeGmina()) {
            problem.setStreet(null);
        }
        Problem saved = problemRepository.save(problem);

        String text = request.title() + "\n" + request.description();
        List<InnovationMatchResponse> matches = matchmakingService.findMatches(text);

        return new ProblemWithMatchesResponse(problemMapper.toResponse(saved), matches, saved.getTrackingToken());
    }

    public List<ProblemSummaryResponse> getProblems() {
        return problemRepository.findAllSummaries();
    }

    // JST sees reports from its own gmina, ROPS sees the whole region
    public List<ProblemSummaryResponse> getReportedProblems(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return switch (user.getRole()) {
            case ROPS, ADMIN -> problemRepository.findAllSummaries();
            case JST -> problemRepository.findSummariesByGminaId(user.getGminaId());
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        };
    }

    public ProblemResponse getProblem(Long id) {
        return problemRepository.findById(id)
                .map(problemMapper::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public ProblemTrackingResponse getByToken(String token) {
        return problemRepository.findByTrackingToken(token)
                .map(p -> tracking(p, true))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono zgłoszenia o tym kodzie"));
    }

    @Transactional(readOnly = true)
    public List<ProblemTrackingResponse> getMine(Long authorId) {
        return problemRepository.findByAuthorIdOrderByLocalDateDesc(authorId).stream()
                .map(p -> tracking(p, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProblemTrackingResponse> adminList(ProblemStatus status) {
        return problemRepository.findAllByOrderByLocalDateDesc().stream()
                .filter(p -> status == null || p.effectiveStatus() == status)
                .map(p -> tracking(p, false))
                .toList();
    }

    public long unseenCount() {
        return problemRepository.countByAdminSeen(false);
    }

    @Transactional
    public ProblemTrackingResponse adminView(Long id) {
        Problem p = problemRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (Boolean.FALSE.equals(p.getAdminSeen())) {
            p.setAdminSeen(true);
            problemRepository.save(p);
        }
        return tracking(p, false);
    }

    @Transactional
    public ProblemTrackingResponse review(Long id, ProblemReviewRequest request) {
        Problem p = problemRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (request.status() != null) p.setStatus(request.status());
        if (request.reply() != null) {
            String reply = request.reply().trim();
            p.setAdminReply(reply.isEmpty() ? null : reply.length() > 3000 ? reply.substring(0, 3000) : reply);
        }
        p.setAdminSeen(true);
        p.setUpdatedAt(Instant.now());
        return tracking(problemRepository.save(p), false);
    }

    private ProblemTrackingResponse tracking(Problem p, boolean withToken) {
        String author = p.getAuthor() == null ? null : p.getAuthor().getName();
        return new ProblemTrackingResponse(problemMapper.toResponse(p), withToken ? p.getTrackingToken() : null,
                p.getAdminReply(), p.getUpdatedAt(), !Boolean.FALSE.equals(p.getAdminSeen()), author);
    }

    private static String newToken() {
        byte[] bytes = new byte[18];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
