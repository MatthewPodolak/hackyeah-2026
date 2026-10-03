package com.example.backend.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
public class OpenAiClient {

    private final RestClient chatClient;
    private final RestClient imageClient;
    private final String model;
    private final String imageModel;
    private final boolean configured;

    public OpenAiClient(@Value("${openai.api-key:}") String apiKey,
                        @Value("${openai.model:gpt-4o-mini}") String model,
                        @Value("${openai.image-model:dall-e-3}") String imageModel) {
        this.model = model;
        this.imageModel = imageModel;
        this.configured = apiKey != null && !apiKey.isBlank();
        this.chatClient = build(apiKey, Duration.ofSeconds(60));
        this.imageClient = build(apiKey, Duration.ofSeconds(120));   // obrazy trwają dłużej
    }

    private static RestClient build(String apiKey, Duration readTimeout) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
        factory.setReadTimeout(readTimeout);
        return RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }

    /** Odpowiedź w formacie JSON (prompt musi zawierać słowo "JSON"). */
    public String chatJson(String system, String user) {
        return complete(List.of(
                Map.of("role", "system", "content", system),
                Map.of("role", "user", "content", user)), true);
    }

    /** Zwykły czat wielotur (asystent kreatora). */
    public String chatText(List<Map<String, String>> messages) {
        return complete(messages, false);
    }

    /** Zwraca URL obrazu albo data:image/png;base64,... zależnie od modelu. */
    public String generateImage(String prompt) {
        requireKey();
        JsonNode res = imageClient.post().uri("/images/generations")
                .contentType(MediaType.APPLICATION_JSON)
                .body(imageModel.startsWith("dall-e")
                        ? Map.of("model", imageModel, "prompt", prompt, "size", "1024x1024", "response_format", "b64_json")
                        : Map.of("model", imageModel, "prompt", prompt, "size", "1024x1024"))
                .retrieve().body(JsonNode.class);
        JsonNode img = res == null ? null : res.path("data").path(0);
        if (img == null) throw new IllegalStateException("Pusta odpowiedź generatora obrazów");
        String b64 = img.path("b64_json").asText("");
        if (!b64.isBlank()) return "data:image/png;base64," + b64;
        String url = img.path("url").asText("");
        if (url.isBlank()) throw new IllegalStateException("Brak obrazu w odpowiedzi");
        return url;
    }

    private String complete(List<Map<String, String>> messages, boolean json) {
        requireKey();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        if (json) body.put("response_format", Map.of("type", "json_object"));

        JsonNode res = chatClient.post().uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve().body(JsonNode.class);

        String content = res == null ? "" : res.path("choices").path(0).path("message").path("content").asText("");
        if (content.isBlank()) throw new IllegalStateException("Pusta odpowiedź modelu");
        return content;
    }

    private void requireKey() {
        if (!configured) throw new IllegalStateException("Brak klucza OPENAI_API_KEY");
    }

}