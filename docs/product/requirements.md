# Vayura AI Product Requirements (v0.1)

## Product Goal
Build a reliable AI-assisted workflow platform that supports document ingestion, processing, and actionable outputs for users with clear status visibility.

## Scope for Initial Releases
- User onboarding and authentication
- Document ingestion pipeline with PDF, Excel, and image support
- Processing lifecycle tracking and reporting
- Role-aware dashboard and operational controls

## Core Principles
- Keep architecture simple and scalable
- Prioritize developer clarity and maintainability
- Ship in small increments with measurable outcomes

## Non-Goals (Initial Phase)
- Premature microservices split
- Heavy infra before traffic/throughput justifies it
- Over-customized UI primitives when robust design system components exist

## Planned features (specs)

| Feature | Spec | Notes |
|---------|------|--------|
| **Client Viewer Portal** (read-only client org access) | [feature-client-viewer-portal.md](./feature-client-viewer-portal.md) | Ships **after** tenant/org model, roles, reports pipeline, and email; see sequencing in that doc. |

Ingestion, processing, and reporting remain in [development plan](../development-plan.md). The client portal layers on once consultant workflows and report artifacts exist.
