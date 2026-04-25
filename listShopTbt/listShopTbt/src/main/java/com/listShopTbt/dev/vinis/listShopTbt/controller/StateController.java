package com.listShopTbt.dev.vinis.listShopTbt.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.StateRequest;
import com.listShopTbt.dev.vinis.listShopTbt.dto.AuthDtos.StateResponse;
import com.listShopTbt.dev.vinis.listShopTbt.service.AppStateService;
import com.listShopTbt.dev.vinis.listShopTbt.service.AuditService;
import io.jsonwebtoken.Claims;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class StateController {
    private final AppStateService appStateService;
    private final AuditService auditService;

    public StateController(AppStateService appStateService, AuditService auditService) {
        this.appStateService = appStateService;
        this.auditService = auditService;
    }

    @GetMapping("/public/state")
    public StateResponse publicState() {
        return new StateResponse(appStateService.getState());
    }

    @GetMapping("/state")
    public StateResponse state() {
        return new StateResponse(appStateService.getState());
    }

    @PutMapping("/state")
    public StateResponse save(@RequestBody StateRequest request, Authentication authentication) {
        JsonNode state = appStateService.saveState(request.state());
        Claims claims = (Claims) authentication.getDetails();
        auditService.record(
                "SAVE_STATE",
                String.valueOf(claims.get("baseId")),
                String.valueOf(claims.get("userId")),
                String.valueOf(claims.get("role")),
                authentication.getName(),
                "OK",
                "Estado sincronizado pelo frontend."
        );
        return new StateResponse(state);
    }
}
