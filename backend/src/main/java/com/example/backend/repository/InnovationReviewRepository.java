package com.example.backend.repository;

import com.example.backend.model.InnovationReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InnovationReviewRepository extends JpaRepository<InnovationReview, Long> {
    List<InnovationReview> findByInnovationIdOrderByCreatedAtDesc(String innovationId);
}