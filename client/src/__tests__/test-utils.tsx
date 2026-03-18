import React from "react";
import { render as rtlRender } from "@testing-library/react";

type RenderOptions = Parameters<typeof rtlRender>[1];

export function render(ui: React.ReactElement, options?: RenderOptions) {
  return rtlRender(ui, {
    ...options,
  });
}

export * from "@testing-library/react";

