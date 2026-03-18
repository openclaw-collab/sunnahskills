export type StudioThemePresetId = "brand" | "sage" | "ink" | "clay";

export type StudioThemePreset = {
  id: StudioThemePresetId;
  label: string;
  vars: Partial<Record<string, string>>;
};

export type StudioState = {
  enabled: boolean;
  themePresetId: StudioThemePresetId;
  edits: Record<string, string>;
  comments: Record<
    string,
    Array<{
      id: string;
      author?: string;
      message: string;
      createdAt: string;
    }>
  >;
};

export type StudioBlockMeta = {
  id: string;
  label: string;
  page?: string;
};

