package com.example.backend.repository;

import com.example.backend.model.CatalogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogEntryRepository extends JpaRepository<CatalogEntry, String> {
    List<CatalogEntry> findAllByOrderByPositionAscIdAsc();
}
