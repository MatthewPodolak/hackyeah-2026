package com.example.backend.controller;

import com.example.backend.dto.GrantCallRequest;
import com.example.backend.model.GrantCall;
import com.example.backend.repository.GrantCallRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/grant-calls")
@RequiredArgsConstructor
public class AdminGrantCallController {

    private final GrantCallRepository calls;

    @GetMapping
    public List<GrantCall> list() {
        return calls.findAll(Sort.by(Sort.Direction.DESC, "openTo"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GrantCall create(@RequestBody GrantCallRequest request) {
        GrantCall call = new GrantCall();
        apply(call, request);
        return calls.save(call);
    }

    @PutMapping("/{id}")
    public GrantCall update(@PathVariable Long id, @RequestBody GrantCallRequest request) {
        GrantCall call = calls.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        apply(call, request);
        return calls.save(call);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!calls.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        calls.deleteById(id);
    }

    private static void apply(GrantCall call, GrantCallRequest r) {
        if (r.name() == null || r.name().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj nazwę naboru");
        if (r.openFrom() == null || r.openTo() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj daty naboru");
        if (r.openTo().isBefore(r.openFrom()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Data końca nie może być przed datą początku");
        call.setName(r.name().trim());
        call.setDescription(r.description());
        call.setOpenFrom(r.openFrom());
        call.setOpenTo(r.openTo());
        call.setRequiredSections(r.requiredSections());
    }
}
