# Frontend Development Process

This process keeps frontend work consistent for independent repo development.

## Workflow for New Screen/Flow
1. Define user goal and success state.
2. Break flow into reusable components and route-level page.
3. Build static UI first with Ant Design.
4. Integrate API calls and loading/error states.
5. Add validations and edge-case handling.
6. Verify accessibility and responsiveness.
7. Update docs if shared patterns changed.

## Definition of Done (Frontend)
- route is registered and reachable
- design states covered (loading, empty, error, success)
- API integration follows typed contracts
- no duplicated business logic across pages
- docs/rules updated when introducing new patterns

## UX Quality Checks
- critical path can be completed with minimal steps
- user always understands current status and next action
- error messages are actionable, not generic
