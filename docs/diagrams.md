# Diagrams

This document keeps project diagrams close to the codebase so workflow and architecture changes can be reviewed with normal commits.

## System Context

```mermaid
flowchart LR
    User[ERP user] --> Web[React / Vite frontend]
    Web --> API[FastAPI backend]
    API --> DB[(PostgreSQL)]

    DB --> Projects[Project cost centers]
    DB --> Procurement[Purchase orders]
    DB --> Inventory[Materials and stock]
    DB --> Billing[Payment claims]
```

## Project Cost Center Model

```mermaid
erDiagram
    CLIENTS ||--o{ PROJECTS : owns
    PROJECTS ||--o{ WORK_ITEMS : budgets
    PROJECTS ||--o{ PURCHASE_ORDERS : procures
    PROJECTS ||--o{ MATERIAL_USAGES : consumes
    PROJECTS ||--o{ COST_ENTRIES : records
    PROJECTS ||--o{ PAYMENT_CLAIMS : bills
    SUPPLIERS ||--o{ PURCHASE_ORDERS : supplies
    MATERIALS ||--o{ MATERIAL_USAGES : used_as
    WORK_ITEMS ||--o{ MATERIAL_USAGES : consumes
    WORK_ITEMS ||--o{ COST_ENTRIES : allocates
```

## Procurement Status Flow

```mermaid
stateDiagram-v2
    [*] --> draft
    draft --> submitted: submit for approval
    submitted --> approved: approve
    submitted --> draft: return to draft
    approved --> received: receive goods/services
    received --> [*]

    note right of draft
        Draft purchase orders can be edited or deleted.
    end note

    note right of received
        Received purchase orders are locked.
    end note
```

## Procurement Sequence

```mermaid
sequenceDiagram
    actor User
    participant Web as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL

    User->>Web: Create purchase order draft
    Web->>API: POST /purchase-orders
    API->>DB: Insert purchase order
    DB-->>API: Purchase order row
    API-->>Web: PurchaseOrderOut

    User->>Web: Submit for approval
    Web->>API: PATCH /purchase-orders/{id}/status submitted
    API->>DB: Validate transition and update status
    API-->>Web: Updated purchase order

    User->>Web: Approve
    Web->>API: PATCH /purchase-orders/{id}/status approved
    API->>DB: Validate transition and update status
    API-->>Web: Updated purchase order

    User->>Web: Receive
    Web->>API: PATCH /purchase-orders/{id}/status received
    API->>DB: Lock received purchase order
    API-->>Web: Updated purchase order

    Web->>API: GET /dashboard
    API->>DB: Aggregate procurement metrics
    API-->>Web: Dashboard summary
```

## Future Access Model

```mermaid
flowchart TD
    User[User] --> Membership[Project membership]
    Membership --> Project[Project cost center]
    Membership --> Role[Project role]

    Role --> ViewCost[View costs]
    Role --> UpdateProgress[Update progress]
    Role --> CreatePO[Create purchase orders]
    Role --> ApprovePO[Approve purchase orders]
    Role --> ManageClaims[Manage payment claims]

    Project --> Procurement[Procurement]
    Project --> Inventory[Inventory usage]
    Project --> Billing[Progress billing]
```

## Suggested Diagram Backlog

- Material receiving and job-site usage flow.
- Progress billing status flow.
- Authentication and project membership sequence.
- Future permission model before adding external authorization tools.
