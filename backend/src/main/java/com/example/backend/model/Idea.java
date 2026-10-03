package com.example.backend.model;

import com.example.backend.mapper.IdeaStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "ideas")
public class Idea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, updatable = false)
    private String trackingToken;

    @Column(columnDefinition = "TEXT")
    private String essence;


    private String title;

    @Column(columnDefinition = "TEXT")
    private String problemDescription;

    private String targetGroup;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> whoCategories = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> disabilityTypes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private Readiness readiness;
    private String gminaId;

    private Long sourceProblemId;

    @Column(columnDefinition = "TEXT")
    private String canvasJson;
    @Column(columnDefinition = "TEXT")
    private String aiFeedbackJson;

    private String email;
    private boolean emailConsent;

    @Enumerated(EnumType.STRING)
    private IdeaStatus status = IdeaStatus.SUBMITTED;
    @Column(columnDefinition = "TEXT")
    private String adminReply;
    private boolean adminSeen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private AppUser author;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private boolean publishConsent;

    @Column(columnDefinition = "TEXT")
    private String visualization;

    @Column(columnDefinition = "TEXT")
    private String visualizationAlt;

    @PrePersist void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }
    @PreUpdate  void onUpdate() {
        updatedAt = LocalDateTime.now();
    }


}
