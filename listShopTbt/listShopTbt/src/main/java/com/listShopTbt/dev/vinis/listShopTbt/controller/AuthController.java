package com.listShopTbt.dev.vinis.listShopTbt.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.AdminLoginRequest;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.AdminResponse;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.AuthResponse;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.LoginRequest;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.StateRequest;
import com.listShopTbt.dev.vinis.listShopTbt.security.JwtService;
import com.listShopTbt.dev.vinis.listShopTbt.service.AppStateService;
import com.listShopTbt.dev.vinis.listShopTbt.service.AuditService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AppStateService appStateService;
    private final AuditService auditService;
    private final JwtService jwtService;
    private final String adminUsername;
    private final String adminPassword;

    public AuthController(
            AppStateService appStateService,
            AuditService auditService,
            JwtService jwtService,
            @Value("${app.admin.username}") String adminUsername,
            @Value("${app.admin.password}") String adminPassword
    ) {
        this.appStateService = appStateService;
        this.auditService = auditService;
        this.jwtService = jwtService;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        JsonNode state = appStateService.getState();
        JsonNode base = appStateService.findBaseByCode(state, request.baseCode());

        if (base == null) {
            auditService.record("LOGIN", null, null, null, request.username(), "DENIED", "Base nao encontrada.");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Base nao encontrada.");
        }

        JsonNode user = appStateService.findUser(base, request.username(), request.password());
        if (user == null) {
            auditService.record("LOGIN", base.path("id").asText(), null, null, request.username(), "DENIED", "Usuario ou senha invalidos.");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario ou senha invalidos para essa base.");
        }

        String token = jwtService.createToken(
                user.path("username").asText(),
                user.path("role").asText(),
                base.path("id").asText(),
                user.path("id").asText()
        );
        JsonNode stateWithSession = appStateService.withSession(state, base.path("id").asText(), user.path("id").asText());
        auditService.record("LOGIN", base.path("id").asText(), user.path("id").asText(), user.path("role").asText(), user.path("username").asText(), "OK", "Acesso liberado.");
        return new AuthResponse(token, stateWithSession, base, user);
    }

    @PostMapping("/create-base")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse createBase(@RequestBody StateRequest request) {
        JsonNode state = appStateService.saveState(request.state());
        JsonNode base = state.path("bases").isArray() && state.path("bases").size() > 0
                ? state.path("bases").get(state.path("bases").size() - 1)
                : null;

        if (base == null || base.path("users").isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado inicial da base invalido.");
        }

        JsonNode user = base.path("users").get(0);
        String token = jwtService.createToken(user.path("username").asText(), user.path("role").asText(), base.path("id").asText(), user.path("id").asText());
        auditService.record("CREATE_BASE", base.path("id").asText(), user.path("id").asText(), user.path("role").asText(), user.path("username").asText(), "OK", "Base criada pelo formulario publico.");
        return new AuthResponse(token, state, base, user);
    }

    @PostMapping("/admin/login")
    public AdminResponse adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        if (!adminUsername.equals(request.username()) || !adminPassword.equals(request.password())) {
            auditService.record("ADMIN_LOGIN", null, null, "admin", request.username(), "DENIED", "Credenciais admin invalidas.");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario ou senha admin invalidos.");
        }

        auditService.record("ADMIN_LOGIN", null, null, "admin", request.username(), "OK", "Painel admin liberado.");
        return new AdminResponse(jwtService.createToken(request.username(), "admin", "", ""), appStateService.getState());
    }
}
