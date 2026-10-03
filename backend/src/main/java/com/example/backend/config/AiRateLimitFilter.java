package com.example.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AiRateLimitFilter extends OncePerRequestFilter {
    private static final List<String> AI_PATHS = List.of(
            "/api/v1/ideas/draft", "/canvas/suggest", "/feedback", "/api/v1/assistant/",
            "/application", "/api/v1/middleman", "/api/v1/matchmaking", "/api/v1/problems",
            "/api/v1/admin/stats/insights", "/visualize");

    @Value("${ai.rate-limit-per-minute:20}")
    private int maxPerMinute;

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        return !"POST".equals(req.getMethod()) || AI_PATHS.stream().noneMatch(req.getRequestURI()::contains);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        long now = System.currentTimeMillis();
        Deque<Long> q = hits.computeIfAbsent(req.getRemoteAddr(), k -> new ArrayDeque<>());
        boolean allowed;
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > 60_000) q.pollFirst();
            allowed = q.size() < maxPerMinute;
            if (allowed) q.addLast(now);
        }
        if (!allowed) {
            res.setStatus(429);
            res.setContentType("text/plain;charset=UTF-8");
            res.getWriter().write("Za dużo zapytań. Spróbuj za chwilę.");
            return;
        }
        chain.doFilter(req, res);
    }
}
