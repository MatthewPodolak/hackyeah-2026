package com.example.backend.config;

import com.example.backend.model.GrantCall;
import com.example.backend.repository.GrantCallRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Real ROPS Kraków grant calls (finished) and one open demo call, from data/grant-calls.json.
 * Only missing calls are added (by sourceKey), so it is safe to run on an existing database.
 * A demo call that is no longer in the file is removed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GrantCallSeeder {

    private final GrantCallRepository calls;
    private final ObjectMapper mapper;

    @EventListener(ApplicationReadyEvent.class)
    public void seed() throws IOException {
        JsonNode data;
        try (InputStream in = new ClassPathResource("data/grant-calls.json").getInputStream()) {
            data = mapper.readTree(in);
        }
        List<GrantCall> missing = new ArrayList<>();
        Set<String> keys = new HashSet<>();
        for (JsonNode node : data.path("calls")) {
            String key = node.path("key").asString();
            keys.add(key);
            if (!calls.existsBySourceKey(key)) {
                missing.add(toCall(node, data.path("forms").path(node.path("form").asString())));
            }
        }
        if (!missing.isEmpty()) {
            calls.saveAll(missing);
            log.info("Dodano {} naborów grantowych z data/grant-calls.json", missing.size());
        }

        // a demo call replaced in the file is removed; real calls and calls added by ROPS are never touched
        List<GrantCall> outdatedDemos = calls.findAll().stream()
                .filter(c -> Boolean.TRUE.equals(c.getDemo()) && c.getSourceKey() != null && !keys.contains(c.getSourceKey()))
                .toList();
        if (!outdatedDemos.isEmpty()) {
            calls.deleteAll(outdatedDemos);
            log.info("Usunięto {} nieaktualnych naborów przykładowych", outdatedDemos.size());
        }
    }

    private GrantCall toCall(JsonNode node, JsonNode form) {
        GrantCall call = new GrantCall();
        call.setSourceKey(node.path("key").asString());
        call.setName(node.path("name").asString());
        call.setProject(node.path("project").asString());
        call.setGoal(node.path("goal").asString());
        String coverage = node.path("coverage").asString("");
        call.setDescription(coverage.isBlank() ? call.getGoal() : call.getGoal() + "\n\nFinansowanie: " + coverage);
        call.setMaxGrantPLN(node.path("maxGrantPLN").isNumber() ? node.path("maxGrantPLN").asInt() : null);
        call.setOwnContributionRequired(node.path("ownContributionRequired").isBoolean() ? node.path("ownContributionRequired").asBoolean() : null);
        List<String> types = new ArrayList<>();
        node.path("applicantTypes").forEach(t -> types.add(t.asString()));
        call.setApplicantTypes(types);
        call.setOpenFrom(LocalDate.parse(node.path("openFrom").asString()));
        call.setOpenTo(LocalDate.parse(node.path("openTo").asString()));
        call.setSourceUrl(node.path("sourceUrl").asString());
        call.setDemo(node.path("demo").asBoolean(false));

        // the AI draft and the ROPS form read the plain list of section titles
        List<String> titles = new ArrayList<>();
        form.path("sections").forEach(s -> titles.add(s.path("title").asString()));
        call.setRequiredSections(String.join("\n", titles));
        call.setSectionsJson(form.path("sections").isMissingNode() ? null : mapper.writeValueAsString(form.path("sections")));
        call.setCriteriaJson(form.path("criteria").isMissingNode() ? null : mapper.writeValueAsString(form.path("criteria")));
        return call;
    }
}
