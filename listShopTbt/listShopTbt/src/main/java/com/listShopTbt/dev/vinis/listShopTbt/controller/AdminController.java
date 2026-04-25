package com.listShopTbt.dev.vinis.listShopTbt.controller;

import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.AdminReportResponse;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.AuthResponse;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.ImpersonateRequest;
import com.listShopTbt.dev.vinis.listShopTbt.security.JwtService;
import com.listShopTbt.dev.vinis.listShopTbt.service.AppStateService;
import com.listShopTbt.dev.vinis.listShopTbt.service.AuditService;
import com.listShopTbt.dev.vinis.listShopTbt.service.FlowReportService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AppStateService appStateService;
    private final AuditService auditService;
    private final FlowReportService flowReportService;
    private final JwtService jwtService;

    public AdminController(AppStateService appStateService, AuditService auditService, FlowReportService flowReportService, JwtService jwtService) {
        this.appStateService = appStateService;
        this.auditService = auditService;
        this.flowReportService = flowReportService;
        this.jwtService = jwtService;
    }

    @GetMapping("/reports")
    public AdminReportResponse reports() {
        var state = appStateService.getState();
        return new AdminReportResponse(state, auditService.recent(), flowReportService.build(state));
    }

    @PostMapping("/impersonate")
    public AuthResponse impersonate(@RequestBody ImpersonateRequest request) {
        var state = appStateService.getState();

        for (var base : state.path("bases")) {
            if (!base.path("id").asText().equals(request.baseId())) {
                continue;
            }
            for (var user : base.path("users")) {
                if (!user.path("id").asText().equals(request.userId())) {
                    continue;
                }

                String token = jwtService.createToken(user.path("username").asText(), user.path("role").asText(), base.path("id").asText(), user.path("id").asText());
                var stateWithSession = appStateService.withSession(state, base.path("id").asText(), user.path("id").asText());
                auditService.record("ADMIN_IMPERSONATE", base.path("id").asText(), user.path("id").asText(), user.path("role").asText(), user.path("username").asText(), "OK", "Admin entrou como usuario.");
                return new AuthResponse(token, stateWithSession, base, user);
            }
        }

        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario para impersonacao nao encontrado.");
    }
}
