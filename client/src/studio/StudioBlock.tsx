import React, { useEffect } from "react";
import { useStudio } from "./useStudio";

export function StudioBlock({
  id,
  label,
  page,
  children,
}: {
  id: string;
  label: string;
  page?: string;
  children: React.ReactNode;
}) {
  const { registerBlock } = useStudio();

  useEffect(() => {
    registerBlock({ id, label, page });
  }, [id, label, page, registerBlock]);

  return <>{children}</>;
}

