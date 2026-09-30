import "@testing-library/jest-dom/vitest";

// `server-only` throws outside a React Server Components bundle, which
// includes Vitest. Stub it so server modules can be unit tested.
vi.mock("server-only", () => ({}));
