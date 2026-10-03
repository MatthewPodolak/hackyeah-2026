package com.example.backend.repository;

import com.example.backend.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);
    List<Conversation> findByStatusOrderByCreatedAtDesc(String status);
    List<Conversation> findAllByOrderByCreatedAtDesc();
}