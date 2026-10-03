package com.example.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class AdminKeyInterceptor implements HandlerInterceptor {

    @Value("${admin.key:}")
    private String adminKey;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws IOException {
        if ("OPTIONS".equals(req.getMethod())) return true;          // preflight CORS
        String given = req.getHeader("X-Admin-Key");
        if (!adminKey.isBlank() && given != null
                && MessageDigest.isEqual(adminKey.getBytes(StandardCharsets.UTF_8),
                given.getBytes(StandardCharsets.UTF_8))) {
            return true;
        }
        res.sendError(HttpServletResponse.SC_FORBIDDEN);
        return false;
    }
}
