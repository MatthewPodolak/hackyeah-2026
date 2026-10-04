package com.example.backend.service;

import com.example.backend.client.OpenAiClient;
import com.example.backend.config.CreatorReferenceData;
import com.example.backend.dto.AdminStatsResponse;
import com.example.backend.dto.AdminStatsResponse.Bucket;
import com.example.backend.dto.AdminStatsResponse.TestedInnovation;
import com.example.backend.dto.StatsInsights;
import com.example.backend.mapper.IdeaStatus;
import com.example.backend.model.*;
import com.example.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {

    private static final ZoneId ZONE = ZoneId.of("Europe/Warsaw");

    private final ProblemRepository problems;
    private final IdeaRepository ideas;
    private final TestParticipationRepository participations;
    private final InnovationReviewRepository reviews;
    private final ConversationRepository conversations;
    private final PartnershipPostRepository partnerships;
    private final AppUserRepository users;
    private final InnovationCatalog catalog;
    private final OpenAiClient openAi;
    private final ObjectMapper mapper;
    private final CreatorReferenceData ref;

    @Transactional(readOnly = true)
    public String resolveScope(Long userId, String requestedGminaId) {
        AppUser user = userId == null ? null : users.findById(userId).orElse(null);
        if (user != null && user.getRole() == Role.JST) {
            if (user.getGminaId() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Konto JST nie ma przypisanej gminy");
            }
            return user.getGminaId();
        }
        if (requestedGminaId == null || requestedGminaId.isBlank()) return null;
        if (!ref.gminaExists(requestedGminaId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieznana gmina");
        }
        return requestedGminaId;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse stats(String gminaId) {
        boolean region = gminaId == null;
        List<Problem> everyProblem = problems.findAll();
        List<Problem> allProblems = region ? everyProblem
                : everyProblem.stream().filter(p -> gminaId.equals(p.getGminaId())).toList();
        Set<Long> scopedProblemIds = allProblems.stream().map(Problem::getId).collect(Collectors.toSet());
        List<Idea> allIdeas = region ? ideas.findAll()
                : ideas.findAll().stream()
                        .filter(i -> gminaId.equals(i.getGminaId()) || (i.getSourceProblemId() != null && scopedProblemIds.contains(i.getSourceProblemId())))
                        .toList();

        Map<String, Long> totals = new LinkedHashMap<>();
        totals.put("problems", (long) allProblems.size());
        totals.put("problemsUnseen", allProblems.stream().filter(p -> Boolean.FALSE.equals(p.getAdminSeen())).count());
        totals.put("problemsOpen", allProblems.stream().filter(p -> p.effectiveStatus() != ProblemStatus.RESOLVED && p.effectiveStatus() != ProblemStatus.REJECTED).count());
        totals.put("ideas", (long) allIdeas.size());
        totals.put("ideasUnseen", allIdeas.stream().filter(i -> !i.isAdminSeen()).count());

        List<TestedInnovation> tested = List.of();
        List<Bucket> byGmina = List.of();
        if (region) {
            List<TestParticipation> allParticipations = participations.findAll();
            List<InnovationReview> allReviews = reviews.findAll();
            totals.put("testParticipations", (long) allParticipations.size());
            totals.put("testParticipationsPending", allParticipations.stream().filter(p -> "PENDING".equals(p.getStatus())).count());
            totals.put("reviews", (long) allReviews.size());
            totals.put("conversationsOpen", conversations.findAll().stream().filter(c -> "OPEN".equals(c.getStatus())).count());
            totals.put("partnerships", partnerships.findAll().stream().filter(PartnershipPost::isActive).count());

            Map<String, Long> wanted = allParticipations.stream().collect(Collectors.groupingBy(TestParticipation::getInnovationId, Collectors.counting()));
            Map<String, List<InnovationReview>> reviewsBy = allReviews.stream().collect(Collectors.groupingBy(InnovationReview::getInnovationId));
            Set<String> testedIds = new HashSet<>(wanted.keySet());
            testedIds.addAll(reviewsBy.keySet());
            tested = testedIds.stream().map(id -> {
                        List<InnovationReview> rs = reviewsBy.getOrDefault(id, List.of());
                        double avg = rs.stream().mapToInt(InnovationReview::getRating).average().orElse(0);
                        String name = catalog.find(id).map(InnovationData::name).orElse(id);
                        return new TestedInnovation(id, name, wanted.getOrDefault(id, 0L), rs.size(), Math.round(avg * 10) / 10.0);
                    })
                    .sorted(Comparator.comparingLong(TestedInnovation::participations).thenComparingLong(TestedInnovation::reviews).reversed())
                    .limit(8)
                    .toList();

            byGmina = allProblems.stream().filter(p -> p.getGminaId() != null)
                    .collect(Collectors.groupingBy(Problem::getGminaId, Collectors.counting()))
                    .entrySet().stream()
                    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                    .limit(10)
                    .map(e -> new Bucket(e.getKey(), e.getValue()))
                    .toList();
        }

        YearMonth now = YearMonth.now(ZONE);
        Map<YearMonth, Long> perMonth = allProblems.stream().filter(p -> p.getLocalDate() != null)
                .collect(Collectors.groupingBy(p -> YearMonth.from(p.getLocalDate().atZone(ZONE)), Collectors.counting()));
        List<Bucket> byMonth = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth m = now.minusMonths(i);
            byMonth.add(new Bucket(m.toString(), perMonth.getOrDefault(m, 0L)));
        }

        Map<String, Long> whoCounts = new HashMap<>();
        allIdeas.forEach(i -> i.getWhoCategories().forEach(w -> whoCounts.merge(w, 1L, Long::sum)));

        AdminStatsResponse.Scope scope = region ? null : ref.findGmina(gminaId)
                .map(g -> new AdminStatsResponse.Scope(gminaId, g.gmina().label(), g.powiat().label(), g.gmina().population()))
                .orElse(new AdminStatsResponse.Scope(gminaId, gminaId, null, null));

        return new AdminStatsResponse(
                scope,
                totals,
                count(allProblems, p -> p.getCategory() == null ? ProblemCategory.OTHER : p.getCategory(), ProblemCategory.values()),
                count(allProblems, p -> p.getTargetGroup() == null ? TargetGroup.OTHER : p.getTargetGroup(), TargetGroup.values()),
                count(allProblems, Problem::effectiveStatus, ProblemStatus.values()),
                byMonth,
                byGmina,
                count(allIdeas, Idea::getStatus, IdeaStatus.values()),
                count(allIdeas, Idea::getReadiness, Readiness.values()),
                whoCounts.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .map(e -> new Bucket(e.getKey(), e.getValue())).toList(),
                tested);
    }

    public StatsInsights insights(String gminaId) {
        AdminStatsResponse stats = stats(gminaId);
        String audience = stats.scope() == null
                ? "dla ROPS i samorządów z całego województwa"
                : "dla samorządu gminy " + stats.scope().label() + " (dane dotyczą tylko tej gminy)";
        String system = """
                Jesteś analitykiem Regionalnego Ośrodka Polityki Społecznej w Krakowie. Na podstawie zagregowanych
                danych z platformy (zgłoszone problemy mieszkańców, pomysły na innowacje, zgłoszenia do testów)
                opisz najważniejsze trendy i zaproponuj działania %s.
                Opieraj się wyłącznie na liczbach z danych, nie wymyślaj nowych. Przy małej liczbie zgłoszeń zaznacz,
                że wnioski są wstępne. Pisz prostym językiem po polsku.
                Zwróć WYŁĄCZNIE JSON: {"summary":"2-3 zdania","trends":["..."],"recommendations":["..."]}
                """.formatted(audience);
        try {
            return mapper.readValue(openAi.chatJson(system, "DANE (JSON):\n" + mapper.writeValueAsString(stats)), StatsInsights.class);
        } catch (Exception e) {
            log.warn("Stats insights failed", e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Asystent AI jest chwilowo niedostępny. Spróbuj ponownie za chwilę.");
        }
    }

    private static <T, E extends Enum<E>> List<Bucket> count(List<T> items, Function<T, E> key, E[] values) {
        Map<E, Long> counts = items.stream().map(key).filter(Objects::nonNull).collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        return Arrays.stream(values).map(v -> new Bucket(v.name(), counts.getOrDefault(v, 0L))).toList();
    }
}
