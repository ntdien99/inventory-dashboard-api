# Intelligent Inventory Dashboard — System Design Document

**Scenario:** B — Intelligent Inventory Dashboard (Supply domain)

**Implementation choice:** Backend service (REST API + persistent database), frontend mocked via OpenAPI spec / CURL harness.

---

# 1. Introduction

## Purpose

The Intelligent Inventory Dashboard provides dealership managers with a real-time overview of vehicle inventory, helping them quickly identify aging stock and track actions taken to improve inventory turnover.

The proposed solution focuses on simplicity, maintainability, and scalability while satisfying the functional requirements of this assessment.

---

# 2. Requirements Summary

The system must support the following capabilities:

1. Display dealership inventory with filtering by attributes such as make, model, and inventory age.
2. Automatically identify vehicles that have remained in inventory for more than 90 days.
3. Allow managers to record and persist an action or status for each aging vehicle.

---

# 3. Assumptions

The assessment intentionally contains ambiguous requirements. The following assumptions were made during the design process.

| #   | Ambiguity                                                                     | Assumption Made                                                                                                                                                                                          | Rationale                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Real-time overview" — does this require push updates (WebSockets/SSE)?       | Interpreted as **"always up-to-date on request,"** served via a normal request/response REST API (client polls or refreshes), not live server push.                                                      | Core requirements describe list/filter/log actions — nothing implies a live trading-floor style feed. A polling/refresh UX satisfies "real-time overview" for a manager checking a dashboard, with far less complexity. Push updates are noted as a future enhancement. |
| 2   | What counts as the "age" of a vehicle?                                        | Calendar days since `receivedDate` (`CURRENT_DATE - receivedDate`), threshold **> 90 days = aging**.                                                                                                     | Matches the literal requirement text; no other lifecycle event (e.g., "days since last price change") was specified.                                                                                                                                                    |
| 3   | Is "action" a fixed enum (e.g., only "Price Reduction Planned") or free text? | Modeled as a **free-text `status` string** with suggested common values (e.g., "Price Reduction Planned", "Marketing Push", "Transfer to Another Lot"), not a rigid enum.                                | The example given ("e.g., ...") implies illustrative, not exhaustive, values. Free text avoids blocking managers on an incomplete predefined list; enum values can be enforced later once real usage patterns are known.                                                |
| 4   | Should actions overwrite the vehicle's status, or accumulate history?         | Actions are **appended to an audit trail** (`action-log` table), with the vehicle exposing a `latestAction` for quick display plus full `actionHistory` on the detail view.                              | An append-only log preserves manager decision history (useful for accountability/reporting) at negligible extra cost, versus a single mutable field that silently loses prior context.                                                                                  |
| 5   | Can manager log action for vehicle <= 90 days?                                | No. Manager can only log action for vehicle > 90 days                                                                                                                                                    | From the requirement, allow manager to log action for "each aging vehicle", not for each vehicle                                                                                                                                                                        |
| 6   | Does a sold/reserved vehicle need lifecycle handling?                         | Vehicles carry a `status` field (`in_stock` / `sold` / `reserved`); only `in_stock` vehicles are considered for "inventory" and aging calculations by default. Full sale-workflow logic is out of scope. | Needed for the dashboard to not show sold cars indefinitely as "aging," but building a full sales-workflow was not requested.                                                                                                                                           |
| 7   | Does the system require full User Registration / JWT Authentication?          | Authentication is assumed to be provided by the dealership platform. The application receives an authenticated manager identity and therefore does not implement login functionality.                    | Middleware Context Stubbing: To keep the service focused on core domain logic while remaining production-ready, authentication is stubbed via an Express context middleware (req.user) that extracts manager identity headers (x-user-id).                              |

---

# 4. High-Level Architecture

```mermaid
flowchart LR

    Client["Client Applications<br/>(Web UI / Swagger / cURL)"]

    subgraph Backend["Express Backend (Node.js + TypeScript)"]

        Router["REST API Router"]

        subgraph Modules["Business Modules"]
            Vehicle["Vehicle Module"]
            Action["Action Log Module"]
        end

        Shared["Shared Components<br/>Validation • Authentication • Logging"]

        Router --> Vehicle
        Router --> Action

    end

    Prisma["Prisma ORM"]

    DB[(PostgreSQL)]

    Obs["Observability<br/>Winston"]

    Client -->|REST API| Router

    Vehicle --> Prisma
    Action --> Prisma

    Prisma --> DB

    Backend -. Logs .-> Obs
```

---

# 5. Component Responsibilities

| Component          | Role                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client Application | Responsible for: <br> - Displaying inventory <br> - Filtering and highlighting aging stock <br> - Recording manager actions                                                                                               |
| Express Backend    | Provides REST APIs and coordinates business logic. <br> Responsibilities include: <br> - Request validation <br> - Business rule execution <br> - Aging stock calculation <br> - Action persistence <br> - Error handling |
| Vehicle Module     | Responsible for: <br> - Inventory retrieval <br> - Filtering <br> - Pagination <br> - Aging stock identification                                                                                                          |
| Action Log Module  | Responsible for: <br> - Recording manager actions <br> - Maintaining action history <br> - Returning the latest action for each vehicle                                                                                   |
| Prisma ORM         | Provides type-safe database access and migration management while abstracting SQL queries                                                                                                                                 |
| PostgreSQL         | Stores: <br> - Vehicle inventory <br> - Manager actions                                                                                                                                                                   |
| Observability      | Responsible for application logging, error tracking, and audit trails (Winston)                                                                                                                                           |

# 6. Data Flow

## Flow 1: Filtering Inventory & Identifying Aging Vehicles

```mermaid
flowchart LR
    Client([Manager / React Dashboard])

    subgraph API
        Controller[Vehicle Controller]
        Validator[Zod Validation]
        Service[Vehicle Service]
    end

    Prisma[Prisma ORM]
    DB[(PostgreSQL)]

    Client -->|GET /vehicles?make=Toyota&isAging=true&page=1&limit=10| Controller

    Controller --> Validator
    Validator -->|Validated query| Service

    Service -->|Build filters<br/>• make='Toyota'<br/>• Pagination<br/>• Latest Action| Prisma

    Prisma -->|Indexed query| DB
    DB -->|Vehicle records| Prisma
    Prisma --> Service

    Service -->|Calculate ageInDays<br/>Determine isAging| Controller

    Controller -->|200 OK<br/>Vehicles + Latest Action + Pagination| Client
```

## Flow 2: Get Vehicle

```mermaid
flowchart LR
    Client([Manager / React Dashboard])

    subgraph API
        Controller[Vehicle Controller]
        Validator[Zod Validation]
        Service[Vehicle Service]
    end

    Prisma[Prisma ORM]
    DB[(PostgreSQL)]

    Client -->|"GET /vehicles/:id"| Controller

    Controller --> Validator
    Validator -->|"Validated vehicle id"| Service

    Service -->|"Fetch vehicle<br/>Include actionLogs<br/>Order by createdAt DESC"| Prisma

    Prisma -->|"SELECT Vehicle<br/>JOIN ActionLogs"| DB
    DB -->|"Vehicle + Action Logs"| Prisma
    Prisma --> Service

    Service -->|"Compute ageInDays<br/>Assemble response"| Controller
    Controller -->|"200 OK<br/>Vehicle + Audit Log[]"| Client

    Service -.->|"Vehicle not found"| Controller
    Controller -.->|"404 Not Found"| Client
```

## Flow 3: Logging an Action on Aging Stock

```mermaid
flowchart LR
    Client([Manager / React Dashboard])

    subgraph API
        Controller[Action Controller]
        Validator[Zod Validation]
        Service[Action Log Service]
    end

    Prisma[Prisma ORM]
    DB[(PostgreSQL)]

    Client -->|"POST /vehicles/:id/actions<br/>action, notes"| Controller

    Controller --> Validator
    Validator -->|"Validated request"| Service

    Service -->|"Read vehicle by id"| Prisma
    Prisma -->|"SELECT Vehicle"| DB
    DB -->|"Vehicle record<br/>ageInDays"| Prisma
    Prisma --> Service

    Service -->|"Verify vehicle exists<br/>Check ageInDays > 90"| Service

    Service -->|"Create ActionLog<br/>vehicleId, userId<br/>action, notes"| Prisma
    Prisma -->|"INSERT ActionLog"| DB
    DB -->|"Committed record"| Prisma
    Prisma --> Service

    Service -->|"Success"| Controller
    Controller -->|"201 Created"| Client

    Service -.->|"Vehicle not found<br/>or ageInDays ≤ 90"| Controller
    Controller -.->|"404 Not Found or 400 Bad Request"| Client
```

# 7. Technology Choices

| Layer      | Technology         | Justification                                                 |
| ---------- | ------------------ | ------------------------------------------------------------- |
| Frontend   | React + TypeScript | Strong typing, reusable components, excellent ecosystem       |
| Backend    | Node.js + Express  | Lightweight framework suitable for REST APIs                  |
| Language   | TypeScript         | Improves maintainability and reduces runtime errors           |
| ORM        | Prisma             | Type-safe queries, migrations, excellent developer experience |
| Database   | PostgreSQL         | Reliable relational database with strong indexing support     |
| Validation | Zod                | Runtime validation with inferred TypeScript types             |
| Logging    | Winston            | Structured JSON logging                                       |

---

# 8. Data Model Overview

# Entity Relationship Diagram

```mermaid
erDiagram
    VEHICLES ||--o{ ACTION_LOGS : "has many"
    VEHICLES {
        id uuid PK
        vin string
        make string
        model string
        year int
        price decimal
        received_date timestamp
        status enum
        created_at timestamp
        updated_at timestamp
    }
    ACTION_LOGS {
        id uuid PK
        vehicle_id uuid FK
        action string
        notes text
        created_by_id string
        created_at timestamp
    }
```

Relationship:

- One Vehicle can have many Action Logs.
- Every Action Log belongs to exactly one Vehicle.
- Deleting a Vehicle automatically removes its Action Logs using **ON DELETE CASCADE**.

---

# Database Tables

## vehicles

Stores every vehicle currently tracked by the dealership.

| Column        | Type          | Constraints       | Description                    |
| ------------- | ------------- | ----------------- | ------------------------------ |
| id            | UUID          | Primary Key       | Internal identifier            |
| vin           | VARCHAR(17)   | Unique, Not Null  | Vehicle Identification Number  |
| make          | VARCHAR(50)   | Not Null          | Manufacturer                   |
| model         | VARCHAR(50)   | Not Null          | Vehicle model                  |
| year          | INTEGER       | Not Null          | Manufacturing year             |
| price         | DECIMAL(10,2) | Not Null          | Vehicle selling price          |
| received_date | TIMESTAMP     | Not Null          | Date vehicle entered inventory |
| status        | ENUM          | Default: IN_STOCK | Current inventory status       |
| created_at    | TIMESTAMP     | Default NOW()     | Record creation timestamp      |
| updated_at    | TIMESTAMP     | Auto Updated      | Last modification timestamp    |

### Vehicle Status Enum

| Value    | Description                   |
| -------- | ----------------------------- |
| IN_STOCK | Vehicle is available for sale |
| RESERVED | Reserved by a customer        |
| SOLD     | Vehicle has been sold         |

> **Assumption:** Although only `IN_STOCK` is required by the scenario, additional statuses (`RESERVED`, `SOLD`) are included to support realistic dealership inventory management.

---

## action_logs

Stores immutable audit records whenever a manager performs an action on a vehicle.

| Column        | Type         | Constraints   | Description            |
| ------------- | ------------ | ------------- | ---------------------- |
| id            | UUID         | Primary Key   | Action identifier      |
| vehicle_id    | UUID         | Foreign Key   | Related vehicle        |
| action        | VARCHAR(255) | Not Null      | Action performed       |
| notes         | TEXT         | Nullable      | Optional manager notes |
| created_by_id | VARCHAR(50)  | Nullable      | Manager identifier     |
| created_at    | TIMESTAMP    | Default NOW() | Action timestamp       |

### Foreign Key

| Column     | References  | On Delete |
| ---------- | ----------- | --------- |
| vehicle_id | vehicles.id | CASCADE   |

---

# 9. API Overview

| Method | Endpoint                 | Purpose                                          |
| ------ | ------------------------ | ------------------------------------------------ |
| GET    | `/vehicles`              | Retrieve inventory with filtering and pagination |
| GET    | `/vehicles/{id}`         | Retrieve vehicle details                         |
| POST   | `/vehicles/{id}/actions` | Record a new manager action                      |

---

# 10. Observability Strategy

The application is designed with observability as a first-class concern.

## Logging

## Logging Format

The application uses **structured JSON logging** instead of plain text.

Example:

```json
{
  "timestamp": "2026-08-03 09:57:18.36 +07:00",
  "level": "info",
  "pid": 40503,
  "hostname": "hostname",
  "message": {
    "method": "POST",
    "url": "/api/v1/vehicles/76b704ff-3863-40fa-baed-08b463efd111/actions",
    "status": 404,
    "userId": "mgr_demo_101"
  }
}
```

Logs support troubleshooting and operational monitoring.

# 11. Security Considerations

The design incorporates standard backend security practices.

- HTTPS for encrypted communication
- JWT authentication (provided externally)
- Request validation using Zod
- SQL injection protection through Prisma
- Authorization to ensure managers only access inventory belonging to their dealership
- Audit history for all manager actions

---

# 12. Use of GenAI During the Design Phase

Generative AI was used as an engineering productivity tool during the design process.

Specifically, GenAI assisted with:

- Exploring alternative architectural approaches.
- Evaluating the trade-offs between a modular monolith and microservices.
- Reviewing REST API resource design.
- Suggesting database normalization and indexing strategies.
- Drafting architecture diagrams and documentation.
- Reviewing assumptions for ambiguous requirements.
- Identifying industry-standard observability practices.

All architectural decisions, assumptions, and trade-offs were reviewed manually before inclusion in the final design.

---
