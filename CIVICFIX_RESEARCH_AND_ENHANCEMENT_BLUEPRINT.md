# CivicFix (PS-09): Comprehensive Repository Analysis, System Audit & Engineering Blueprint

---

## 1. Executive Summary & Competitive Analysis of Existing Repositories

### 1.1 Comparative Matrix of Analyzed Repositories

| Feature / Metric | `JEETJM/civicfix-ai` (Render Live Site) | `Jivikadixit/CivicFix-AI` | `Pruthvi226/CivicFix` | `codinggita/civicfix` | **CivicFix 2.0 (Target Architecture)** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tech Stack** | MERN (React, Express, MongoDB, Cloudinary, Mapbox) | Client-side PWA (JS, IndexedDB, ServiceWorker, Gemini API) | Java 21, Spring MVC 5.3, Hibernate, MySQL, JSP | React, Node.js, Express, MongoDB, Tailwind | **React + Vite / Node.js + Express (or Spring) + PostgreSQL/PostGIS / Mongo** |
| **Classification** | Hardcoded Keyword Matching (`aiScoring.js`) | Gemini 1.5 Flash Multimodal Vision Prompt | Keyword regex rules (`ComplaintClassifierService.java`) | None (Manual citizen dropdown) | **Hybrid: Gemini 1.5 Flash Vision/Text + Deterministic Fallback Rules** |
| **Deduplication** | Jaccard word set overlap + Haversine <=300m | Geolocation 100m check + client prompt to merge/upvote | Haversine distance <=100m in 30 days (`DuplicateRadarService`) | None | **Tri-Factor: PostGIS/Haversine (<150m) + Sentence Embedding Cosine (>0.82) + Category Filter** |
| **Priority Scoring** | Naive keyword score (base 35 + keyword points, capped 100) | Gemini model hallucinated severity (1-5) | Static severity mapping (Low/Medium/High) | Static urgency dropdown | **Transparent 100-pt Deterministic Rubric with Factor Breakdown Card** |
| **Map & Heatmap** | Mapbox GL markers only (HTML circles; **no true heatmap layer**) | Google Maps SDK + Leaflet fallback (CartoDB tiles) | Leaflet.js with basic marker pins | Leaflet OpenStreetMap LocationPicker | **True Mapbox GL JS Heatmap Layer (`type: heatmap`) + Cluster Points + Hexbin density** |
| **Geocoding & Location** | Captures lat/lng only; **no reverse geocoding**; hardcoded city/state | Draggable pin via Google Maps Geocoder | Form latitude/longitude fields | Click pin to get coords | **Browser GPS + Reverse Geocoder (Nominatim/Mapbox) + NLP Vague Landmark Resolver** |
| **SLA Tracking** | Status badges + static table; no countdown or automated breach rules | Static status updates | Task scheduling dates | Status dropdown (Pending/In Progress/Resolved) | **Dynamic SLA Countdown Clocks + Multi-tier Automated Escalation Engine** |
| **Resolution Verification** | Worker photo upload + citizen text feedback | Gemini Vision Before/After prompt comparison (>=70% auto-close) | Worker photo upload + citizen verify/reject | Simple admin status change | **Dual-Gate: Gemini Before/After Similarity Check + Citizen 48h Dispute/Acceptance Window** |
| **Multilingual / Voice** | None (English only) | Gemini Audio transcription (English only) | None | None | **Sarvam AI / Whisper Multilingual Voice-to-Text (Hindi, Odia, English) -> Auto Translate & Extract** |
| **Public Tracking** | Blocked behind JWT auth (401 error on direct link) | Local IndexedDB only | Public ward pages & transparency portal | Protected routes | **Public Unauthenticated Tracker (Complaint ID + Verification Hash)** |

---

## 2. In-Depth Audit of the Live Application (`civicfix-ai-jmdz.onrender.com`)

### 2.1 Audit of `/complaints/6aeb0fd2bdbcfeb2a06403df`
1. **The 401 Authorization Lockout Bug**:
   - When accessing `https://civicfix-ai-jmdz.onrender.com/complaints/6aeb0fd2bdbcfeb2a06403df` directly, the backend endpoint `/api/complaints/:id` is guarded by `authMiddleware.js`.
   - Any public citizen or evaluator without a stored JWT token in `localStorage` receives:
     ```json
     { "success": false, "message": "Not authorized. Token missing.", "stack": null }
     ```
   - In `ComplaintDetails.jsx`, failure to load sets `complaint = null`, displaying "Complaint not found. The complaint may not exist or you may not have access."
   - **Fix**: Complaint detail viewing for tracking must be **publicly accessible** via Complaint ID (`CFX-2026-906241443`) or tokenless read endpoint, while masking sensitive reporter personal info (PII) like citizen phone/email.

2. **Superficial "AI Priority" Scoring**:
   - The complaint displays `AI Score: 60/100`, `Urgency: Medium`, and `AI Reason: Detected keywords: pothole, road...`.
   - Inspection of `backend/utils/aiScoring.js` reveals:
     - Base score: `35`
     - Matches `road` + `pothole` (Medium risk keywords): `+12`
     - Matches road category: `+12` (if accident) or default additions = `60`.
   - This violates the PS-09 key constraint: *"Do not hide how priority is assigned"*. The system merely outputs a string of text rather than an auditable breakdown of **Severity (20/30) + Public Risk (15/25) + Affected Density (15/20) + Age (10/15) = 60/100**.

3. **Absence of Real SLA Enforcement**:
   - The complaint shows a static timeline ("AI Analyzed").
   - There is no SLA target date, no hours remaining countdown, and no trigger to escalate if the Road Maintenance Department fails to resolve the pothole within the standard 48-hour municipal window.

---

### 2.2 Audit of `/map` (The Heatmap Flaw)
1. **The "Pseudo-Heatmap" Architecture**:
   - `MapView.jsx` claims to present a "Public Civic Heatmap".
   - However, `MapComponent.jsx` implements only:
     ```javascript
     const markerElement = document.createElement("div");
     markerElement.className = "custom-map-marker";
     markerElement.style.backgroundColor = getMarkerColor(marker.markerColor);
     new mapboxgl.Marker(markerElement).setLngLat([marker.location.lng, marker.location.lat]).addTo(mapRef.current);
     ```
   - It only places individual HTML `div` markers styled red, yellow, or green.
2. **Naive String-Based Zone Clustering**:
   - In `backend/utils/heatmapGenerator.js`, zones are computed by splitting the raw text address string:
     ```javascript
     const addressParts = address.split(",");
     const firstPart = addressParts[0]?.trim();
     return firstPart || city;
     ```
   - This causes identical geographical coordinates with slightly different address spellings (e.g., "ITER main gate" vs "ITER Jagmohan Nagar") to be split into separate zones, completely failing spatial clustering.
3. **What a Real Mapbox Heatmap Requires**:
   - Mapbox GL JS features a dedicated GPU-accelerated layer type: `'heatmap'`.
   - It computes Gaussian density kernels weighted by priority score (`heatmap-weight`), smoothly interpolating from blue (low density) -> yellow -> red (high critical density).
   - At closer zoom levels (zoom >= 14), the heatmap transitions seamlessly into individual interactive cluster pins.

---

### 2.3 Audit of `/report-issue` (The Geolocation & Address Flaw)
1. **Raw Numerical Coords Without Reverse Geocoding**:
   - In `ReportIssue.jsx`, `handleGetLocation` calls `navigator.geolocation.getCurrentPosition`:
     ```javascript
     setFormData((prev) => ({
       ...prev,
       lat: position.coords.latitude.toFixed(6),
       lng: position.coords.longitude.toFixed(6),
     }));
     ```
   - It fills numerical `lat` and `lng` state fields, but leaves the `address` text box blank! The user is forced to manually type out their street address.
2. **The Hardcoded State & City Trap**:
   - `ReportIssue.jsx` initializes state with:
     ```javascript
     city: "Kolkata",
     state: "West Bengal"
     ```
   - When a user at ITER Bhubaneswar (Odisha, coordinates `19.361076, 84.868114`) grants location permission and submits, the backend stores:
     - `address: "Iter main gate jagmohan nagar"`
     - `city: "Bhubneswar"`
     - `state: "West Bengal"`
   - This corrupts administrative routing and invalidates municipal boundaries.
3. **Inability to Resolve Vague Text Descriptions**:
   - If a citizen enters *"Big drain overflow near water tank behind college"* without granting GPS access, the system accepts it with `lat: null, lng: null` and cannot plot it on the map or detect duplicates geographically.
   - PS-09 explicitly requires: *"Support complaints about issues such as potholes, waste, streetlights and drains, even when location details are vague."*

---

## 3. PS-09 Problem Statement Breakdown & Winning Criteria

### 3.1 The Five Mandatory Deliverables
1. **Complaint Input**: Text, image, and voice input across at least 5 issue categories.
2. **5+ Issue Types**:
   - Road Damage & Potholes (`road`)
   - Waste & Garbage Disposal (`sanitation`)
   - Streetlights & Electrical Hazards (`electricity`)
   - Drains & Waterlogging (`drainage`)
   - Water Supply & Pipe Bursts (`water`)
   - *(Bonus categories: Public Safety, Fallen Trees/Parks, Traffic Signals)*
3. **Location Mapping**: Pinpointing exact coordinates, reverse-geocoded addresses, and landmark-approximated zones.
4. **Duplicate Detection & Grouping**: Grouping complaints by spatial proximity, semantic description similarity, and category.
5. **Transparent Priority Scoring & SLA Dashboard**: Mathematical 100-pt priority formula with an administrative SLA countdown and automated escalation tracker.

### 3.2 The Core Constraint
> **"Do not silently reject complaints or hide how priority is assigned."**
- If an image cannot be recognized or GPS is denied, **never drop the ticket**.
- Assign it an initial category or route it to a **Manual Triage Queue** with a `"Low Location Confidence"` badge.
- Every priority score must display a clickable **"Explain Score"** breakdown dialog showing the exact mathematical weights.

---

## 4. Architectural Blueprint for CivicFix 2.0

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CITIZEN PORTAL                                 │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Multilingual Voice    │  │ Image Capture        │  │ Reverse Geocoded │  │
│  │ (Odia / Hindi / Eng)  │  │ (Camera / Upload)    │  │ Location & Map   │  │
│  └──────────┬────────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼──────────────────────────┼───────────────────────┼────────────┘
              │                          │                       │
              ▼                          ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INTELLIGENCE ENGINE                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 1. Multilingual Translation & Normalization (Sarvam / Whisper API)    │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ 2. Vague Landmark Extractor & Geo-Resolver (Nominatim / Regex Bounds) │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ 3. Gemini Multimodal Classifier (Vision Category + Severity)          │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ 4. Tri-Factor Duplicate Radar (Spatial <=150m + Embedding Sim >0.82)  │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ 5. Deterministic Explainable Priority Calculator (100-pt Formula)     │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MUNICIPAL OPERATIONS HUB                            │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ SLA Countdown &       │  │ True Mapbox Heatmap  │  │ Department Work  │  │
│  │ Tier-3 Escalation     │  │ & Cluster Analytics  │  │ Dispatch Queue   │  │
│  └──────────┬────────────┘  └──────────┬───────────┘  └────────┬─────────┘  │
└─────────────┼──────────────────────────┼───────────────────────┼────────────┘
              │                          │                       │
              ▼                          ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ACCOUNTABILITY & VERIFICATION                         │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Field Worker Before/After Photo Upload                                │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Gemini Vision Fix Verification (Confidence Score %)                   │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │ Citizen 48-Hour Dispute or Confirm Closure Loop                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Detailed Engineering Solutions

### 5.1 Geolocation & Vague Landmark Resolution
When a citizen clicks "Get Location" or types a vague description:
1. **GPS Flow**:
   - Call browser geolocation.
   - Immediately execute reverse geocoding via OpenStreetMap Nominatim or Mapbox Geocoding API:
     `GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json`
   - Automatically populate `address`, `suburb/locality`, `city`, `state`, and `postcode`.
2. **Vague Landmark Flow (e.g. "Behind ITER Main Gate, Jagmohan Nagar")**:
   - Extract landmark tokens using NER or regex.
   - Query municipal landmark database or geocoder with city bounding box.
   - If exact coordinates are not found, fall back to the ward centroid and set:
     `location_confidence: "APPROXIMATE_LANDMARK"` (confidence score: 0.60).
   - Flag ticket in admin dashboard: *"Approximate location based on landmark mention. Review pin on map."*

### 5.2 True Mapbox Heatmap Implementation
In `MapComponent.jsx`, configure Mapbox to render a continuous density surface:
- **Source**: GeoJSON FeatureCollection of open complaints.
- **Heatmap Layer**:
  - `heatmap-weight`: Interpolate based on complaint `priorityScore` (0 to 100).
  - `heatmap-intensity`: Boost intensity as zoom level increases.
  - `heatmap-color`: Smooth transition from `rgba(0,0,255,0)` (transparent) -> `royalblue` -> `cyan` -> `lime` -> `yellow` -> `red`.
  - `heatmap-radius`: 25px blur radius.
- **Cluster Point Layer**: Automatically take over at zoom >= 14 with interactive popups showing complaint cards.

### 5.3 Deterministic Explainable Priority Scoring (100 Points)
The priority score $P$ is calculated transparently as:
$$P = S_{\text{severity}} + R_{\text{safety}} + D_{\text{density}} + T_{\text{duration}} + N_{\text{duplicates}}$$

| Factor | Weight | Evaluation Criteria |
| :--- | :---: | :--- |
| **Issue Severity ($S$)** | 0 – 30 | Structural road crater (30), high-voltage wire (30), minor pothole (10), overflowing bin (15) |
| **Public Safety Risk ($R$)** | 0 – 25 | Proximity to schools/hospitals (+15), high-traffic arterial road (+10), night hazard (+10) |
| **Impact / Population ($D$)** | 0 – 20 | Commercial zone (20), residential ward (15), low-density alley (5) |
| **Unresolved Duration ($T$)** | 0 – 15 | $1.5 \text{ pts per day unresolved}$ (capped at 15 points after 10 days) |
| **Duplicate Reports ($N$)** | 0 – 10 | $+2.5 \text{ pts per community duplicate report / confirmation}$ (capped at 10 pts) |

**UI Presentation**: Admin and citizen see a breakdown card:
`Priority Score: 85/100 (Severity: 25/30 | Safety Risk: 20/25 | Ward Density: 15/20 | Age: 15/15 | Duplicates: 10/10)`.

### 5.4 Multilingual Voice-to-Complaint Engine
- **Supported Languages**: Hindi (हिंदी), Odia (ଓଡ଼ିଆ), English.
- **Workflow**:
  1. Citizen records voice in browser (`MediaRecorder` API).
  2. Send audio blob to transcription endpoint (Whisper or Sarvam AI API).
  3. Extract language: `detected_language: "or"` (Odia).
  4. Generate English translation + structured entity extraction (Category, Description, Urgency, Landmark).
  5. Citizen reviews both the original transcript in Odia and the translated English summary before submitting.

### 5.5 Resolution Verification Workflow
1. Field worker marks ticket as "Work Completed" and uploads a photo of the repaired site.
2. **AI Pre-check**: Gemini Vision compares the original complaint photo with the resolution photo:
   - Evaluates whether the pothole is patched or waste removed.
   - Calculates a visual confidence score (e.g., 88%).
3. Ticket moves to **"Awaiting Citizen Verification"**.
4. The reporting citizen receives an SMS/WhatsApp/portal alert with a 48-hour confirmation timer:
   - **Accept**: Ticket permanently closed, karma points awarded to citizen.
   - **Dispute ("Issue Persists")**: Automatically re-opens ticket, increments priority score by +15, and escalates to senior supervisory officer.
