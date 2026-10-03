package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String subject;

    /**
     * QUESTION - pytanie do ROPS
     * MENTORING - konsultacja z ekspertem innowacji
     * PARTNERSHIP - budowanie partnerstwa międzysektorowego
     */
    @Column(nullable = false)
    private String type;

    @Builder.Default
    @Column(nullable = false)
    private String status = "OPEN"; // OPEN / CLOSED

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private AppUser owner;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** ROPS albo JST; puste w starszych wątkach oznacza ROPS */
    @Column(length = 10)
    private String recipientType;

    private String recipientGminaId;

    public String effectiveRecipientType() {
        return recipientType == null ? "ROPS" : recipientType;
    }
}