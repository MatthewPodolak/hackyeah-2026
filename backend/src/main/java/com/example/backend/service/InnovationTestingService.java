package com.example.backend.service;

import com.example.backend.dto.*;
import com.example.backend.model.AppUser;
import com.example.backend.model.InnovationReview;
import com.example.backend.model.TestParticipation;
import com.example.backend.repository.AppUserRepository;
import com.example.backend.repository.InnovationReviewRepository;
import com.example.backend.repository.TestParticipationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InnovationTestingService {

    private final InnovationCatalog catalog;
    private final AppUserRepository users;
    private final TestParticipationRepository participations;
    private final InnovationReviewRepository reviews;

    public void validateInnovationExists(String innovationId) {
        if (catalog.find(innovationId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono innowacji o ID: " + innovationId);
        }
    }

    @Transactional
    public ParticipationResponse submitParticipation(String innovationId, ParticipationRequest r) {
        validateInnovationExists(innovationId);

        TestParticipation p = TestParticipation.builder()
                .innovationId(innovationId)
                .contactName(r.contactName() != null ? r.contactName().trim() : "Mieszkaniec Małopolski")
                .contactEmail(r.contactEmail())
                .contactPhone(r.contactPhone())
                .motivation(r.motivation().trim())
                .status("PENDING")
                .build();

        if (r.userId() != null) {
            users.findById(r.userId()).ifPresent(user -> {
                p.setUser(user);
                if (r.contactEmail() == null) {
                    p.setContactEmail(user.getEmail());
                }
            });
        }

        TestParticipation saved = participations.save(p);
        return mapToParticipationResponse(saved);
    }

    @Transactional
    public void submitReview(String innovationId, ReviewRequest r) {
        validateInnovationExists(innovationId);

        if (r.rating() < 1 || r.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ocena musi mieścić się w przedziale 1-5.");
        }

        InnovationReview rv = InnovationReview.builder()
                .innovationId(innovationId)
                .rating(r.rating())
                .comment(r.comment().trim())
                .improvementSuggestion(r.improvementSuggestion() != null ? r.improvementSuggestion().trim() : null)
                .reviewerName(r.reviewerName() != null && !r.reviewerName().isBlank() ? r.reviewerName().trim() : "Anonimowy tester")
                .build();

        if (r.userId() != null) {
            users.findById(r.userId()).ifPresent(rv::setUser);
        }

        reviews.save(rv);
    }

    @Transactional(readOnly = true)
    public ReviewsResponse getReviews(String innovationId) {
        validateInnovationExists(innovationId);
        List<InnovationReview> list = reviews.findByInnovationIdOrderByCreatedAtDesc(innovationId);

        double avg = list.stream()
                .mapToInt(InnovationReview::getRating)
                .average()
                .orElse(0.0);

        // Zaokrąglenie do 1 miejsca po przecinku
        double roundedAvg = Math.round(avg * 10.0) / 10.0;

        List<ReviewsResponse.ReviewItem> items = list.stream()
                .map(x -> new ReviewsResponse.ReviewItem(
                        x.getId(),
                        x.getReviewerName(),
                        x.getRating(),
                        x.getComment(),
                        x.getImprovementSuggestion(),
                        x.getCreatedAt()))
                .toList();

        return new ReviewsResponse(roundedAvg, items.size(), items);
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponse> getParticipationsForInnovation(String innovationId) {
        validateInnovationExists(innovationId);
        return participations.findByInnovationIdOrderByCreatedAtDesc(innovationId)
                .stream()
                .map(this::mapToParticipationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ParticipationResponse> getAllParticipations(String status) {
        List<TestParticipation> list = (status != null && !status.isBlank())
                ? participations.findByStatusOrderByCreatedAtDesc(status.toUpperCase())
                : participations.findAllByOrderByCreatedAtDesc();

        return list.stream().map(this::mapToParticipationResponse).toList();
    }

    @Transactional
    public ParticipationResponse updateParticipationStatus(Long id, String status) {
        TestParticipation p = participations.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono zgłoszenia do testów o ID: " + id));

        p.setStatus(status.toUpperCase());
        return mapToParticipationResponse(participations.save(p));
    }

    private ParticipationResponse mapToParticipationResponse(TestParticipation p) {
        return new ParticipationResponse(
                p.getId(),
                p.getInnovationId(),
                p.getUser() != null ? p.getUser().getId() : null,
                p.getContactName(),
                p.getContactEmail(),
                p.getContactPhone(),
                p.getMotivation(),
                p.getStatus(),
                p.getCreatedAt()
        );
    }
}