package com.civicfix.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HealthController - Our First REST Controller
 *
 * WHAT IS A REST CONTROLLER?
 * A REST Controller is a Java class that listens for HTTP requests
 * at specific URL paths and returns JSON responses.
 *
 * ANNOTATIONS EXPLAINED:
 *   @RestController = Combines @Controller + @ResponseBody.
 *       It tells Spring: "This class handles web requests,
 *       and every method returns data (JSON), not an HTML page."
 *
 *   @RequestMapping("/api/v1") = A prefix for ALL endpoints in this class.
 *       So @GetMapping("/health") becomes GET /api/v1/health.
 *
 *   @GetMapping("/health") = "When someone sends a GET request to
 *       /api/v1/health, run this method and return the result as JSON."
 *
 * WHY WE BUILD THIS FIRST:
 * Before building complex complaint APIs, we need to verify:
 *   1. Spring Boot starts without errors.
 *   2. The embedded Tomcat web server is listening on port 8080.
 *   3. The PostgreSQL/Supabase database connection works.
 *   4. PostGIS extension is available.
 * This single endpoint tests all four at once.
 */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    /**
     * @Autowired tells Spring: "Find the DataSource bean that was
     * automatically created from application.yml's datasource config,
     * and inject it here so I can use it."
     *
     * DataSource is a connection pool manager. When we call
     * dataSource.getConnection(), it gives us a live database connection
     * from the pool (it doesn't create a new one every time — that would
     * be too slow).
     */
    @Autowired
    private DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("application", "CivicFix Backend API");
        response.put("status", "UP");
        response.put("timestamp", Instant.now().toString());

        // Test database connectivity
        try (Connection connection = dataSource.getConnection()) {
            response.put("database", "CONNECTED");

            // Auto-enable PostGIS extension if not yet enabled
            try (var stmt = connection.createStatement()) {
                stmt.execute("CREATE EXTENSION IF NOT EXISTS postgis");
                var rs = stmt.executeQuery("SELECT PostGIS_Full_Version()");
                if (rs.next()) {
                    response.put("postgis_version", rs.getString(1));
                }
            } catch (Exception postgisEx) {
                response.put("postgis_status", "Extension enable pending: " + postgisEx.getMessage());
            }
        } catch (Exception e) {
            response.put("database", "DISCONNECTED");
            response.put("database_error", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}
