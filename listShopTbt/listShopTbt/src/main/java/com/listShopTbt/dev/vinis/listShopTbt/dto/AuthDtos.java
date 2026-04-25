package com.listShopTbt.dev.vinis.listShopTbt.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank String baseCode,
            @NotBlank String username,
            @NotBlank String password
    ) {
    }

    public record AdminLoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {
    }

    public record StateRequest(JsonNode state) {
    }

    public record ImpersonateRequest(String baseId, String userId) {
    }

    public record AuthResponse(
            String token,
            JsonNode state,
            JsonNode base,
            JsonNode user
    ) {
    }

    public record AdminResponse(
            String token,
            JsonNode state
    ) {
    }

    public record StateResponse(JsonNode state) {
    }

    public record AdminReportResponse(
            JsonNode state,
            Object logs,
            Object flow
    ) {
    }
}
