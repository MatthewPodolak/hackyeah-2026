package com.example.backend.repository;

import com.example.backend.mapper.IdeaStatus;
import com.example.backend.model.Idea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IdeaRepository extends JpaRepository<Idea, Long> {
    Optional<Idea> findByTrackingToken(String token);
    List<Idea> findByStatus(IdeaStatus status);
    List<Idea> findAllByOrderByCreatedAtDesc();
    List<Idea> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    long countByAdminSeenFalse();
}
