package com.example.backend.service;

import com.example.backend.config.CreatorReferenceData;
import com.example.backend.dto.AdminStatsResponse.Bucket;
import com.example.backend.dto.NeedsSurveyDtos.Submit;
import com.example.backend.dto.NeedsSurveyDtos.Summary;
import com.example.backend.model.NeedsSurveyResponse;
import com.example.backend.model.NeedsSurveyResponse.AgeGroup;
import com.example.backend.model.NeedsSurveyResponse.Loneliness;
import com.example.backend.model.ProblemCategory;
import com.example.backend.repository.NeedsSurveyResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NeedsSurveyService {

    private static final int MAX_PER_HOUR = 5;
    private static final Duration WINDOW = Duration.ofHours(1);

    private final NeedsSurveyResponseRepository responses;
    private final CreatorReferenceData ref;
    private final Map<String, Deque<Instant>> recent = new ConcurrentHashMap<>();

    @Transactional
    public void submit(Submit body, String clientKey) {
        throttle(clientKey);
        if (body == null) throw bad("Brak odpowiedzi");
        List<String> priorities = Optional.ofNullable(body.priorities()).orElse(List.of()).stream()
                .filter(Objects::nonNull).distinct().toList();
        Set<String> allowed = Arrays.stream(ProblemCategory.values()).filter(c -> c != ProblemCategory.OTHER).map(Enum::name).collect(Collectors.toSet());
        if (priorities.isEmpty() || priorities.size() > 2 || !allowed.containsAll(priorities)) throw bad("Wybierz jeden lub dwa obszary");
        if (body.serviceAccess() == null || body.serviceAccess() < 1 || body.serviceAccess() > 5) throw bad("Oceń dostęp do pomocy w skali 1–5");
        if (body.loneliness() == null) throw bad("Odpowiedz na pytanie o samotność");
        if (body.ageGroup() == null) throw bad("Wybierz grupę wiekową");
        String gminaId = body.gminaId() == null || body.gminaId().isBlank() ? null : body.gminaId();
        if (gminaId != null && !ref.gminaExists(gminaId)) throw bad("Nieznana gmina");

        NeedsSurveyResponse r = new NeedsSurveyResponse();
        r.setPriorities(new ArrayList<>(priorities));
        r.setServiceAccess(body.serviceAccess());
        r.setLoneliness(body.loneliness());
        r.setAgeGroup(body.ageGroup());
        r.setGminaId(gminaId);
        responses.save(r);
    }

    @Transactional(readOnly = true)
    public Summary summary(String gminaId) {
        List<NeedsSurveyResponse> all = gminaId == null ? responses.findAll() : responses.findByGminaId(gminaId);
        Instant monthAgo = Instant.now().minus(Duration.ofDays(30));
        long last30 = all.stream().filter(r -> r.getCreatedAt() != null && r.getCreatedAt().isAfter(monthAgo)).count();
        OptionalDouble avg = all.stream().mapToInt(NeedsSurveyResponse::getServiceAccess).average();

        Map<String, Long> priorityCounts = new HashMap<>();
        all.forEach(r -> r.getPriorities().forEach(p -> priorityCounts.merge(p, 1L, Long::sum)));
        List<Bucket> priorities = Arrays.stream(ProblemCategory.values()).filter(c -> c != ProblemCategory.OTHER)
                .map(c -> new Bucket(c.name(), priorityCounts.getOrDefault(c.name(), 0L)))
                .sorted(Comparator.comparingLong(Bucket::count).reversed())
                .toList();
        List<Bucket> access = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            int score = i;
            access.add(new Bucket(String.valueOf(i), all.stream().filter(r -> r.getServiceAccess() == score).count()));
        }
        return new Summary(all.size(), last30, avg.isPresent() ? Math.round(avg.getAsDouble() * 10) / 10.0 : null,
                priorities, access,
                count(all, NeedsSurveyResponse::getLoneliness, Loneliness.values()),
                count(all, NeedsSurveyResponse::getAgeGroup, AgeGroup.values()));
    }

    private void throttle(String clientKey) {
        Instant now = Instant.now();
        Deque<Instant> hits = recent.computeIfAbsent(clientKey == null ? "unknown" : clientKey, k -> new ArrayDeque<>());
        synchronized (hits) {
            while (!hits.isEmpty() && hits.peekFirst().isBefore(now.minus(WINDOW))) hits.pollFirst();
            if (hits.size() >= MAX_PER_HOUR) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Dziękujemy – ankieta z tego urządzenia została już wysłana");
            }
            hits.addLast(now);
        }
    }

    private static <E extends Enum<E>> List<Bucket> count(List<NeedsSurveyResponse> all, Function<NeedsSurveyResponse, E> key, E[] values) {
        Map<E, Long> counts = all.stream().map(key).filter(Objects::nonNull).collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        return Arrays.stream(values).map(v -> new Bucket(v.name(), counts.getOrDefault(v, 0L))).toList();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
