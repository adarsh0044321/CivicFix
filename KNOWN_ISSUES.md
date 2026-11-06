# CivicFix: Known Limitations, Risks & Architecture Watchlist

---

## 1. Architectural Watchlist

| Component | Identified Constraint / Limitation | Mitigation / Design Decision |
| :--- | :--- | :--- |
| **Mapbox Rate Limits** | Mapbox free tier has a monthly tile request quota. | Frontend caches vector tiles and provides a graceful fallback to OpenStreetMap raster tiles if the token fails. |
| **PostGIS Spatial Index Dependency** | PostGIS extension must be installed in PostgreSQL; standard PostgreSQL image cannot run `ST_DWithin`. | Use official `postgis/postgis:16-3.4` Docker image in `docker-compose.yml` to ensure seamless local setup. |
| **Vague Landmark Ambiguity** | Landmark descriptions with multiple matches (e.g. *"near SBI bank"*) cannot be resolved to a single exact point. | Tag complaint with `location_confidence: LOW_VAGUE_TRIAGE` and place at ward centroid. Never drop the complaint. |
| **Voice Audio Upload Size** | High-resolution uncompressed WAV audio files can slow down network requests on mobile data. | Enforce browser WebM / Opus audio compression before uploading to backend for transcription. |
| **Public PII Exposure** | Public tracking pages must not leak reporting citizen's phone number or email. | The public tracking DTO (`PublicComplaintResponseDto`) strictly masks personal fields (`Priya M.`, `pr***@***.com`). |
| **Port 8080 Local Collision** | Local system process (`CCProxy.exe` on PID 13792) occupies port 8080 on developer machine. | Spring Boot configured to port `8081` in `application.yml`; Vite dev server proxy configured to target `http://localhost:8081`. |
