package com.example.backend.repository;

import com.example.backend.model.Innovation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InnovationRepository extends JpaRepository<Innovation, Long> {
    List<Innovation> findByKeywordsContainingIgnoreCase(String keywords);
}
