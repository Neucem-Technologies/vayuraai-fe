# Frontend Architecture Notes

## Goals
- Deliver enterprise-grade UX without over-engineering.
- Keep code maintainable as feature count grows.
- Build reusable feature modules instead of page-level duplication.

## Architecture Direction
- `pages` own route composition.
- `components` hold reusable UI building blocks.
- `hooks` hold async/business interaction logic.
- `services` hold API client and transformation logic.

## UI System
- Use Ant Design as the default component library.
- Only introduce custom UI primitives when required by product behavior.
- Keep tokens/themes centralized.

## State Strategy
- Server state: TanStack Query.
- Local UI state: component-level state first.
- Global app state: only when multiple routes need shared state.

## Delivery Rules
- Build screen shell first, then bind real data.
- Keep loading/error/empty states explicit.
- Keep accessibility labels and keyboard behavior in all critical flows.
