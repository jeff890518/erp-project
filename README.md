# Construction ERP

A construction ERP side project for civil engineering contractors, focused on project-based costing, procurement, inventory, subcontracting, and progress billing.

## Overview

This project explores how an ERP system can be adapted for construction companies where each project acts as a cost center. The system is intended to connect project budgets, procurement, site inventory, equipment usage, subcontractor costs, billing claims, and project profitability.

The initial implementation is a Dockerized full-stack application with a small operational dashboard. Future iterations will move the product toward a construction-specific ERP for civil engineering, tunneling, improvement works, grouting, and ground improvement projects.

## Stack

- Frontend: React, TypeScript, Vite
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- Runtime: Docker Compose

## Local Development

```bash
cp .env.example .env
docker compose up --build
```

Services:

- Web app: http://localhost:5173
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

## Project Structure

```text
.
+-- backend/          FastAPI application
+-- database/init/    PostgreSQL initialization scripts
+-- docs/             Project notes and roadmap
+-- frontend/         React application
+-- docker-compose.yml
+-- README.md
```

## Current Scope

The first version provides a construction cost center dashboard with seeded ERP data:

- Project cost centers
- Budget versus actual cost
- Purchase orders
- Material inventory status
- Progress billing claims

This is intentionally small. The next development phase will expand the construction ERP model around:

- Projects as cost centers
- Procurement and supplier management
- Material inventory and job-site usage
- Subcontractor contracts and payment claims
- Project budget versus actual cost
- Progress billing and project profitability

## Development Notes

- Seed data is loaded from `database/init/001_schema.sql` when the PostgreSQL volume is first created.
- To recreate the database from the init SQL, run `docker compose down -v` and start the stack again.
- Backend source is mounted into the API container for FastAPI reloads.
- Frontend source is mounted into the web container for Vite reloads.

## Documentation

- API notes: `docs/api.md`
- Diagrams: `docs/diagrams.md`
- Roadmap: `docs/roadmap.md`
