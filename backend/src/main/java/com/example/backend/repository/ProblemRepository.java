package com.example.backend.repository;

import com.example.backend.dto.ProblemSummaryResponse;
import com.example.backend.model.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {

    @Query("select new com.example.backend.dto.ProblemSummaryResponse(p.id, p.title, p.description, p.latitude, p.longitude, p.localDate, p.street, p.category, p.targetGroup, p.gminaId, p.wholeGmina, coalesce(p.status, com.example.backend.model.ProblemStatus.SUBMITTED)) from Problem p")
    List<ProblemSummaryResponse> findAllSummaries();

    Optional<Problem> findByTrackingToken(String trackingToken);

    List<Problem> findByAuthorIdOrderByLocalDateDesc(Long authorId);

    List<Problem> findAllByOrderByLocalDateDesc();

    List<Problem> findByGminaIdOrderByLocalDateDesc(String gminaId);

    // JST badge: reports of its gmina still waiting for its decision
    @Query("select count(p) from Problem p where p.gminaId = :gminaId and (p.status is null or p.status = com.example.backend.model.ProblemStatus.SUBMITTED)")
    long countWaitingForGmina(@Param("gminaId") String gminaId);

    // ROPS badge: not opened yet and already in the ROPS queue (no gmina, or forwarded by the gmina)
    @Query("select count(p) from Problem p where p.adminSeen = false and (p.gminaId is null or p.status = com.example.backend.model.ProblemStatus.FORWARDED)")
    long countUnseenByRops();
}
