package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ConversationDTOs {

    public record NewConversationRequest(
            @NotNull Long userId,
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Pattern(regexp = "QUESTION|MENTORING|PARTNERSHIP") String type,
            @NotBlank @Size(max = 4000) String content
    ) {}

    public record MessageRequest(
            @NotNull Long senderId,
            @NotBlank @Size(max = 4000) String content
    ) {}

    public record ConversationItem(
            Long id,
            String subject,
            String type,
            String status,
            Long ownerId,
            String ownerName,
            LocalDateTime createdAt
    ) {}

    public record MessageItem(
            Long id,
            Long senderId,
            String senderName,
            String content,
            LocalDateTime sentAt
    ) {}

    public record ConversationStatusRequest(
            @NotBlank @Pattern(regexp = "OPEN|CLOSED") String status
    ) {}

    public record PartnershipRequest(
            @NotNull Long userId,
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 4000) String description,
            @NotBlank @Size(max = 100) String lookingFor
    ) {}

    public record PartnershipPostResponse(
            Long id,
            Long authorId,
            String authorName,
            String title,
            String description,
            String lookingFor,
            boolean active,
            LocalDateTime createdAt
    ) {}
}