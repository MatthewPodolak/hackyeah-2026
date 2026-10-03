package com.example.backend.service;

import com.example.backend.dto.ConversationDTOs.*;
import com.example.backend.model.*;
import com.example.backend.repository.AppUserRepository;
import com.example.backend.repository.ConversationMessageRepository;
import com.example.backend.repository.ConversationRepository;
import com.example.backend.repository.PartnershipPostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunicationService {

    private final ConversationRepository conversations;
    private final ConversationMessageRepository messages;
    private final PartnershipPostRepository partnershipPosts;
    private final AppUserRepository users;

    @Transactional
    public Long createConversation(NewConversationRequest r) {
        AppUser user = users.findById(r.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie znaleziono użytkownika: " + r.userId()));

        Conversation c = Conversation.builder()
                .subject(r.subject().trim())
                .type(r.type().toUpperCase())
                .owner(user)
                .status("OPEN")
                .build();

        Conversation saved = conversations.save(c);

        ConversationMessage firstMsg = ConversationMessage.builder()
                .conversation(saved)
                .sender(user)
                .content(r.content().trim())
                .build();

        messages.save(firstMsg);
        return saved.getId();
    }

    @Transactional(readOnly = true)
    public List<ConversationItem> getConversations(Long userId) {
        AppUser u = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Nieprawidłowy identyfikator użytkownika"));

        boolean isStaff = (u.getRole() == Role.ADMIN || u.getRole() == Role.EXPERT);

        // Personel ROPS i eksperci widzą wszystkie wątki; mieszkaniec widzi tylko swoje
        List<Conversation> list = isStaff
                ? conversations.findAllByOrderByCreatedAtDesc()
                : conversations.findByOwnerIdOrderByCreatedAtDesc(userId);

        return list.stream().map(this::toConversationItem).toList();
    }

    @Transactional(readOnly = true)
    public List<MessageItem> getThreadMessages(Long conversationId, Long userId) {
        authorizeAccess(conversationId, userId);

        return messages.findByConversationIdOrderBySentAtAsc(conversationId).stream()
                .map(m -> new MessageItem(
                        m.getId(),
                        m.getSender().getId(),
                        m.getSender().getName() != null ? m.getSender().getName() : m.getSender().getEmail(),
                        m.getContent(),
                        m.getSentAt()
                )).toList();
    }

    @Transactional
    public MessageItem addReply(Long conversationId, MessageRequest r) {
        Conversation c = authorizeAccess(conversationId, r.senderId());

        if ("CLOSED".equalsIgnoreCase(c.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten wątek został zamknięty.");
        }

        AppUser sender = users.findById(r.senderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));

        ConversationMessage m = ConversationMessage.builder()
                .conversation(c)
                .sender(sender)
                .content(r.content().trim())
                .build();

        ConversationMessage saved = messages.save(m);

        return new MessageItem(
                saved.getId(),
                sender.getId(),
                sender.getName() != null ? sender.getName() : sender.getEmail(),
                saved.getContent(),
                saved.getSentAt()
        );
    }

    @Transactional
    public void updateConversationStatus(Long conversationId, Long userId, String newStatus) {
        Conversation c = authorizeAccess(conversationId, userId);
        c.setStatus(newStatus.toUpperCase());
        conversations.save(c);
    }

    @Transactional
    public void createPartnershipPost(PartnershipRequest r) {
        AppUser author = users.findById(r.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nie znaleziono autora o ID: " + r.userId()));

        PartnershipPost post = PartnershipPost.builder()
                .author(author)
                .title(r.title().trim())
                .description(r.description().trim())
                .lookingFor(r.lookingFor().trim())
                .active(true)
                .build();

        partnershipPosts.save(post);
    }

    @Transactional(readOnly = true)
    public List<PartnershipPostResponse> getActivePartnershipPosts() {
        return partnershipPosts.findByActiveTrueOrderByCreatedAtDesc().stream()
                .map(p -> new PartnershipPostResponse(
                        p.getId(),
                        p.getAuthor().getId(),
                        p.getAuthor().getName() != null ? p.getAuthor().getName() : p.getAuthor().getEmail(),
                        p.getTitle(),
                        p.getDescription(),
                        p.getLookingFor(),
                        p.isActive(),
                        p.getCreatedAt()
                )).toList();
    }

    private Conversation authorizeAccess(Long conversationId, Long userId) {
        Conversation c = conversations.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono wątku: " + conversationId));

        AppUser u = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Nieznany użytkownik"));

        boolean isStaff = (u.getRole() == Role.ADMIN || u.getRole() == Role.EXPERT);
        if (!isStaff && !c.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak uprawnień do tego wątku rozmowy");
        }

        return c;
    }

    private ConversationItem toConversationItem(Conversation c) {
        return new ConversationItem(
                c.getId(),
                c.getSubject(),
                c.getType(),
                c.getStatus(),
                c.getOwner().getId(),
                c.getOwner().getName() != null ? c.getOwner().getName() : c.getOwner().getEmail(),
                c.getCreatedAt()
        );
    }
}