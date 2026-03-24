import { useContext } from "react";
import { StudioContext, type StudioContextValue } from "./StudioProvider";

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within <StudioProvider>");
  return ctx;
}
