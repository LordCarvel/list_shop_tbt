package com.listShopTbt.dev.vinis.listShopTbt.repository;

import com.listShopTbt.dev.vinis.listShopTbt.model.AuditLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop80ByOrderByCreatedAtDesc();
}
