package com.listShopTbt.dev.vinis.listShopTbt.service;

import com.listShopTbt.dev.vinis.listShopTbt.model.AuditLog;
import com.listShopTbt.dev.vinis.listShopTbt.repository.AuditLogRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    public void record(String action, String baseId, String userId, String role, String actor, String status, String details) {
        repository.save(new AuditLog(action, baseId, userId, role, actor, status, details));
    }

    public List<AuditLog> recent() {
        return repository.findTop80ByOrderByCreatedAtDesc();
    }
}
