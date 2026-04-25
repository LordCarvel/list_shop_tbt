package com.listShopTbt.dev.vinis.listShopTbt.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "app_state")
public class AppState {
    @Id
    private Long id;

    @Column(name = "state_json", nullable = false, columnDefinition = "text")
    private String stateJson;

    @Column(nullable = false)
    private Instant updatedAt;

    protected AppState() {
    }

    public AppState(Long id, String stateJson) {
        this.id = id;
        this.stateJson = stateJson;
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getStateJson() {
        return stateJson;
    }

    public void setStateJson(String stateJson) {
        this.stateJson = stateJson;
        this.updatedAt = Instant.now();
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
