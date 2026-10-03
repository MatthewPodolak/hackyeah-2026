package com.example.backend.repository;

import com.example.backend.model.KnowledgeResource;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

public interface KnowledgeResourceRepository extends JpaRepository<KnowledgeResource, Long> {
}
