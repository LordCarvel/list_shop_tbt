package com.listShopTbt.dev.vinis.listShopTbt.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class FlowReportService {
    public Map<String, Object> build(JsonNode state) {
        int bases = 0;
        int products = 0;
        int stores = 0;
        int users = 0;
        int movements = 0;
        int closings = 0;
        int requests = 0;
        int pendingRequests = 0;

        for (JsonNode base : state.path("bases")) {
            bases++;
            products += base.path("products").size();
            users += base.path("users").size();
            for (JsonNode unit : base.path("units")) {
                if ("store".equals(unit.path("type").asText())) {
                    stores++;
                }
            }
            JsonNode inventory = base.path("inventory");
            movements += inventory.path("movements").size();
            closings += inventory.path("closings").size();
            requests += inventory.path("shipmentRequests").size();
            for (JsonNode request : inventory.path("shipmentRequests")) {
                if ("pending".equals(request.path("status").asText())) {
                    pendingRequests++;
                }
            }
        }

        Map<String, Object> flow = new HashMap<>();
        flow.put("bases", bases);
        flow.put("products", products);
        flow.put("stores", stores);
        flow.put("users", users);
        flow.put("movements", movements);
        flow.put("closings", closings);
        flow.put("requests", requests);
        flow.put("pendingRequests", pendingRequests);
        return flow;
    }
}
