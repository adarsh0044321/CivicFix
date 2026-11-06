# CivicFix: Architectural Learning Notes & Technical Guide
### Foundations for Beginners in Full-Stack Software Engineering

---

## 1. Why Do We Use a Multi-Tier Architecture?

### The Problem
When beginners start building full-stack applications, they often combine database queries, HTML templates, and business logic into one big file (like PHP or JSP scripts). While simple at first, this approach breaks down as an application grows:
- Security flaws emerge because the frontend has direct access to database credentials.
- Mobile apps cannot reuse the backend code because it only renders web pages.
- A single bug can crash the entire system.

### The Solution: 3-Tier Separation
CivicFix separates responsibility into three distinct layers:

1. **Client Tier (Presentation Layer - React + TypeScript)**:
   - Runs in the user's browser.
   - Its only job is to display UI, capture user clicks and inputs, and communicate with the backend via HTTP.
   - It **never** talks directly to PostgreSQL and never contains secret API keys.

2. **Application Tier (Business Logic Layer - Spring Boot)**:
   - Runs on a private server.
   - Acts as the gatekeeper. It checks permissions, validates input data, runs mathematical algorithms (like our 15-point priority scoring), and orchestrates workflows.

3. **Data Tier (Persistence Layer - PostgreSQL + PostGIS)**:
   - Dedicated storage engine for saving records reliably to disk with ACID guarantees.

```
[Browser: React UI] ──(JSON over HTTP)──► [Server: Spring Boot API] ──(SQL / TCP)──► [Database: PostgreSQL]
```

---

## 2. What is PostGIS and Why Is Standard SQL Inadequate for Geo-distance?

### The Earth Is Not Flat (The Haversine Dilemma)
Suppose we want to find all open complaints within $150\text{ meters}$ of a citizen's GPS coordinates (`latitude: 20.25052, longitude: 85.79581`).

In standard SQL, you might think of using the Pythagorean theorem:
$$d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$$
**Why this fails:**
The Earth is an oblate spheroid. One degree of latitude is roughly $111\text{ km}$, but one degree of longitude shrinks to $0\text{ km}$ at the North Pole! Pythagorean math on degrees creates severe geographic distortion.

### How PostGIS Solves This
PostGIS adds spatial data types (such as `GEOMETRY(Point, 4326)`) and geodesic math functions to PostgreSQL:

```sql
ST_DWithin(
    location_geometry::geography, 
    ST_SetSRID(ST_MakePoint(85.79581, 20.25052), 4326)::geography, 
    150 -- meters
)
```
- **Spatial Indexing (`GIST`)**: Instead of scanning all 100,000 complaints one by one (which takes seconds), a `GIST` (Generalized Search Tree) index groups points into bounding boxes (R-Trees). The database finds nearby complaints in **under 2 milliseconds**.

---

## 3. Understanding the Spring Boot Layered Pattern

When building Spring Boot backends, we organize code into five distinct layers:

```
Request ──► [Controller] ──► [Service] ──► [Repository] ──► [Database]
Response ◄── [DTO] ◄──────── [Service] ◄── [Entity] ◄──────── [Database]
```

### A. The Controller (`@RestController`)
- **Job**: Listens for HTTP requests (like `POST /api/v1/complaints`).
- **Analogy**: The waiter at a restaurant. It takes your order, checks if the order slip is valid, hands it to the kitchen, and brings you the food. It does **not** cook the meal.

### B. The Service (`@Service`)
- **Job**: Contains the actual business rules and algorithms.
- **Analogy**: The chef in the kitchen. It calculates the 15-point priority score, checks if a duplicate exists, and decides which department should receive the ticket.

### C. The Repository (`@Repository`)
- **Job**: Talks to the database using Spring Data JPA.
- **Analogy**: The pantry manager who retrieves ingredients from storage.

### D. Entity vs. DTO (Data Transfer Object)
- **Entity (`ComplaintEntity`)**: A direct Java mirror of the database table. Contains database IDs, foreign keys, and internal flags.
- **DTO (`CreateComplaintRequestDto`)**: A plain Java object representing what the user sent over the network.
- **Why we NEVER return Entities in Controllers**:
  If your `UserEntity` has a field `passwordHash`, and you return the entity directly from a REST controller, that password hash is serialized to JSON and sent to the browser! DTOs ensure we only send what is safe and intended.

---

## 4. What is a Finite State Machine (Complaint Lifecycle)?

A **State Machine** is a mathematical model where an object can only be in one of a fixed set of states at any given time, and moves between states only through strictly defined transitions.

### Why This Matters for Municipal Accountability
In a broken system, a rogue worker could mark a complaint as `RESOLVED` directly without ever doing the work.
In CivicFix, our state machine enforces rules:
1. A complaint can only move from `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `WORK_COMPLETED`.
2. A worker **cannot** set status to `VERIFIED_RESOLVED`.
3. Only an authorized citizen confirmation or administrative audit can transition a ticket from `AWAITING_VERIFICATION` to `VERIFIED_RESOLVED`.

---

## 5. How Stateless JWT Authentication Works

In traditional web apps, when you log in, the server creates a "session" in its memory and sends back a `JSESSIONID` cookie. 
- **The Problem**: If you have 10,000 users or multiple server instances, the server runs out of memory or needs complex session syncing.

### The JWT (JSON Web Token) Way
Instead of storing state on the server, the server generates a cryptographically signed token:
1. **Header**: Alg (HMAC SHA-256)
2. **Payload**: User ID, Role (`CITIZEN`), Expiration (`24 hours`)
3. **Signature**: Cryptographic hash created using a secret key known **only** to the server.

The client stores this token in browser memory or `localStorage`. With every request, the client sends:
```http
Authorization: Bearer <TOKEN>
```
The server checks the signature using its secret key. If valid, the user is authenticated. The server never needs to query a sessions table!

---

## 6. Learning Checkpoints (Self-Verification)

Take a moment to verify your understanding before we proceed:
1. *Why should the React frontend never query PostgreSQL directly?*
   *(Answer: Security, lack of business rule enforcement, and exposure of database credentials).*
2. *Why does PostGIS use `geometry(Point, 4326)` instead of standard X and Y floating-point columns?*
   *(Answer: To calculate geodesic distances accurately on Earth's curvature using spatial R-Tree GIST indexes).*
3. *Why can a field worker not set a complaint to `VERIFIED_RESOLVED`?*
   *(Answer: Because uploading completion proof only moves the ticket to `AWAITING_VERIFICATION`. Only the citizen who lodged the issue or an administrator can verify and permanently close it).*
