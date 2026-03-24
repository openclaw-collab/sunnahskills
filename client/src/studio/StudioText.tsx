import { useStudio } from "./useStudio";
import { cn } from "@/lib/utils";

type Props = {
  k: string;
  defaultText: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3";
  className?: string;
  multiline?: boolean;
};

export function StudioText({ k, defaultText, as = "span", className }: Props) {
  const { edits } = useStudio();
  const value = edits[k] ?? defaultText;
  const Tag = as as any;

  return (
    <Tag className={cn(className)} data-studio-field={k.split(".").pop()}>
      {value}
    </Tag>
  );
}
