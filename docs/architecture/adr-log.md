# Architecture Decision Log

## ADR-001: Monorepo with Separate Frontend and Backend Apps
- **Status:** Accepted
- **Decision:** Maintain `vayura-frontend` and `vayura-backend` as separate app folders in one repository.
- **Why:** Keeps ownership clear, simplifies collaboration, and avoids deployment coupling while preserving shared visibility.

## ADR-002: Lean Scalable Backend
- **Status:** Accepted
- **Decision:** Start with modular monolith architecture (`routes -> services -> data access`) and versioned APIs.
- **Why:** Supports growth without early complexity.

## ADR-003: Ant Design for Frontend Baseline
- **Status:** Accepted
- **Decision:** Use Ant Design as primary UI system.
- **Why:** Enterprise-ready components reduce custom UI debt and speed consistent delivery.

## ADR-004: Docs-First API Development
- **Status:** Accepted
- **Decision:** Every new API includes inline route docs plus shared guideline updates.
- **Why:** Improves onboarding and avoids tribal knowledge.
