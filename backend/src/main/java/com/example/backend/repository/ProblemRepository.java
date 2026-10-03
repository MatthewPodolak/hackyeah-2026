package com.example.backend.repository;

import com.example.backend.dto.ProblemSummaryResponse;
import com.example.backend.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

    @Query("select new com.example.backend.dto.ProblemSummaryResponse(p.id, p.title, p.description, p.latitude, p.longitude, p.localDate, p.street, p.category, p.targetGroup) from Problem p")
    List<ProblemSummaryResponse> findAllSummaries();
}
