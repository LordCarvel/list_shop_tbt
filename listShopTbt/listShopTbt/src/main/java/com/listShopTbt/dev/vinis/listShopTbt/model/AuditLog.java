package com.listShopTbt.dev.vinis.listShopTbt.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false, length = 80)
    private String action;

    @Column(length = 80)
    private String baseId;

    @Column(length = 80)
    private String userId;

    @Column(length = 40)
    private String role;

    @Column(length = 160)
    private String actor;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(columnDefinition = "text")
    private String details;

    protected AuditLog() {
    }

    public AuditLog(String action, String baseId, String userId, String role, String actor, String status, String details) {
        this.action = action;
        this.baseId = baseId;
        this.userId = userId;
        this.role = role;
        this.actor = actor;
        this.status = status;
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public String getAction() {
        return action;
    }

    public String getBaseId() {
        return baseId;
    }

    public String getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getActor() {
        return actor;
    }

    public String getStatus() {
        return status;
    }

    public String getDetails() {
        return details;
    }
}
