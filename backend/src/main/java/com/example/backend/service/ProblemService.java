package com.example.backend.service;

import com.example.backend.config.CreatorReferenceData;
import com.example.backend.dto.InnovationMatchResponse;
import com.example.backend.dto.ProblemRequest;
import com.example.backend.dto.ProblemResponse;
import com.example.backend.dto.ProblemSummaryResponse;
import com.example.backend.dto.ProblemWithMatchesResponse;
import com.example.backend.mapper.ProblemMapper;
import com.example.backend.model.AppUser;
import com.example.backend.dto.GminaDecisionRequest;
import com.example.backend.dto.ProblemReviewRequest;
import com.example.backend.dto.ProblemTrackingResponse;
import com.example.backend.model.Problem;
import com.example.backend.model.Role;
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
    @Transactional(readOnly = true)
    public List<ProblemTrackingResponse> getReportedProblems(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        List<Problem> problems = switch (user.getRole()) {
            case ROPS, ADMIN -> problemRepository.findAllByOrderByLocalDateDesc();
            case JST -> problemRepository.findByGminaIdOrderByLocalDateDesc(user.getGminaId());
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        };
        return problems.stream().map(p -> tracking(p, false)).toList();
    }

    public long getWaitingForGminaCount(Long userId) {
        return problemRepository.countWaitingForGmina(jstUser(userId).getGminaId());
    }

    // JST accepts (with a priority) or declines (with a reason) a report of its own gmina
    @Transactional
    public ProblemTrackingResponse decideAsGmina(Long userId, Long problemId, GminaDecisionRequest request) {
        AppUser jst = jstUser(userId);
        Problem p = problemRepository.findById(problemId)
                .filter(problem -> jst.getGminaId() != null && jst.getGminaId().equals(problem.getGminaId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!p.waitsForGmina()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Gmina już podjęła decyzję w tej sprawie");
        }
        String note = request.note() == null || request.note().isBlank() ? null : limit(request.note().trim(), 2000);
        if (Boolean.TRUE.equals(request.accept())) {
            if (request.priority() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wybierz priorytet zgłoszenia");
            }
            p.setStatus(ProblemStatus.FORWARDED);
            p.setPriority(request.priority());
        } else {
            if (note == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj powód odrzucenia");
            }
            p.setStatus(ProblemStatus.GMINA_REJECTED);
            p.setPriority(null);
        }
        p.setGminaNote(note);
        p.setGminaDecidedAt(Instant.now());
        p.setUpdatedAt(p.getGminaDecidedAt());
        return tracking(problemRepository.save(p), false);
    }

    private AppUser jstUser(Long userId) {
        return appUserRepository.findById(userId)
                .filter(user -> user.getRole() == Role.JST)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }

    private static String limit(String text, int max) {
        return text.length() > max ? text.substring(0, max) : text;
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
        return problemRepository.countUnseenByRops();
    }

    @Transactional
    public ProblemTrackingResponse adminView(Long id) {
        Problem p = problemRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // a report still waiting for the gmina stays "nowe" until it reaches the ROPS queue
        if (Boolean.FALSE.equals(p.getAdminSeen()) && !p.waitsForGmina()) {
            p.setAdminSeen(true);
            problemRepository.save(p);
        }
        return tracking(p, false);
    }

    @Transactional
    public ProblemTrackingResponse review(Long id, ProblemReviewRequest request) {
        Problem p = problemRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (p.waitsForGmina()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Zgłoszenie czeka na decyzję gminy");
        }
        // SUBMITTED and GMINA_REJECTED belong to the gmina; any ROPS status on a declined report brings it back
        boolean gminaStatus = request.status() == ProblemStatus.SUBMITTED || request.status() == ProblemStatus.GMINA_REJECTED;
        if (gminaStatus && request.status() != p.effectiveStatus()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten status nadaje gmina");
        }
        if (request.status() != null) p.setStatus(request.status());
        if (request.priority() != null) p.setPriority(request.priority());
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
        if (withToken) {
            // resident: no priority and no internal note, only the gmina's reason when it declined
            String reason = p.effectiveStatus() == ProblemStatus.GMINA_REJECTED ? p.getGminaNote() : null;
            return new ProblemTrackingResponse(problemMapper.toResponse(p), p.getTrackingToken(), p.getAdminReply(),
                    p.getUpdatedAt(), true, author, null, reason, p.getGminaDecidedAt());
        }
        return new ProblemTrackingResponse(problemMapper.toResponse(p), null, p.getAdminReply(), p.getUpdatedAt(),
                !Boolean.FALSE.equals(p.getAdminSeen()), author, p.getPriority(), p.getGminaNote(), p.getGminaDecidedAt());
    }

    private static String newToken() {
        byte[] bytes = new byte[18];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
