package com.listShopTbt.dev.vinis.listShopTbt.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.listShopTbt.dev.vinis.listShopTbt.model.AppState;
import com.listShopTbt.dev.vinis.listShopTbt.repository.AppStateRepository;
import jakarta.transaction.Transactional;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class AppStateService {
    private static final long SINGLETON_ID = 1L;
    private static final String EMPTY_STATE = "{\"bases\":[],\"session\":null}";

    private final AppStateRepository repository;
    private final ObjectMapper objectMapper;

    public AppStateService(AppStateRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public JsonNode getState() {
        AppState state = repository.findById(SINGLETON_ID)
                .orElseGet(() -> repository.save(new AppState(SINGLETON_ID, EMPTY_STATE)));
        return readTree(state.getStateJson());
    }

    @Transactional
    public JsonNode saveState(JsonNode state) {
        JsonNode normalized = normalizeState(state);
        AppState current = repository.findById(SINGLETON_ID)
                .orElseGet(() -> new AppState(SINGLETON_ID, EMPTY_STATE));
        current.setStateJson(toJson(normalized));
        repository.save(current);
        return normalized;
    }

    public JsonNode findBaseByCode(JsonNode state, String baseCode) {
        String normalizedCode = normalizeBaseCode(baseCode);
        for (JsonNode base : state.path("bases")) {
            if (normalizedCode.equals(base.path("code").asText())) {
                return base;
            }
        }
        return null;
    }

    public JsonNode findUser(JsonNode base, String username, String password) {
        String normalizedUsername = normalizeUsername(username);
        for (JsonNode user : base.path("users")) {
            if (
                    normalizedUsername.equals(user.path("username").asText()) &&
                    password.equals(user.path("password").asText())
            ) {
                return user;
            }
        }
        return null;
    }

    public JsonNode withSession(JsonNode state, String baseId, String userId) {
        ObjectNode copy = state.deepCopy();
        ObjectNode session = objectMapper.createObjectNode();
        session.put("baseId", baseId);
        session.put("userId", userId);
        copy.set("session", session);
        return copy;
    }

    public String normalizeBaseCode(String value) {
        return String.valueOf(value == null ? "" : value)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9-]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    public String normalizeUsername(String value) {
        return String.valueOf(value == null ? "" : value)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", "");
    }

    private JsonNode normalizeState(JsonNode state) {
        ObjectNode normalized = objectMapper.createObjectNode();
        normalized.set("bases", state != null && state.path("bases").isArray() ? state.path("bases") : objectMapper.createArrayNode());
        normalized.set("session", state != null && !state.path("session").isMissingNode() ? state.path("session") : objectMapper.nullNode());
        return normalized;
    }

    private JsonNode readTree(String json) {
        try {
            return normalizeState(objectMapper.readTree(json));
        } catch (JsonProcessingException exception) {
            return readTree(EMPTY_STATE);
        }
    }

    private String toJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Nao foi possivel salvar o estado do sistema.", exception);
        }
    }
}
