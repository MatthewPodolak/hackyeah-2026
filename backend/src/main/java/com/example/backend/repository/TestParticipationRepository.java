package com.example.backend.repository;

import com.example.backend.model.TestParticipation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestParticipationRepository extends JpaRepository<TestParticipation, Long> {
    List<TestParticipation> findByInnovationIdOrderByCreatedAtDesc(String innovationId);
    List<TestParticipation> findByStatusOrderByCreatedAtDesc(String status);
    List<TestParticipation> findAllByOrderByCreatedAtDesc();
    List<TestParticipation> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByStatus(String status);
}