import "@testing-library/jest-dom";

// Radix UI (Tabs/Dialog) expects ResizeObserver in the environment.
if (!(globalThis as any).ResizeObserver) {
  (globalThis as any).ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

