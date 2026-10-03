package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ConversationDTOs {

    public record NewConversationRequest(
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Pattern(regexp = "QUESTION|MENTORING|PARTNERSHIP") String type,
            @NotBlank @Size(max = 4000) String content,
            @Pattern(regexp = "ROPS|JST") String recipient,
            @Size(max = 100) String gminaId
    ) {}

    public record MessageRequest(
            @NotBlank @Size(max = 4000) String content
    ) {}

    public record ConversationItem(
            Long id,
            String subject,
            String type,
            String status,
            Long ownerId,
            String ownerName,
            LocalDateTime createdAt,
            String recipientType,
            String recipientGminaId,
            String recipientLabel
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