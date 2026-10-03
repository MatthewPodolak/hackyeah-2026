package com.example.backend.repository;

import com.example.backend.model.PartnershipPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartnershipPostRepository extends JpaRepository<PartnershipPost, Long> {
    List<PartnershipPost> findByActiveTrueOrderByCreatedAtDesc();
    List<PartnershipPost> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
}