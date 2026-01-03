// Theme configuration types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  secondaryColor?: string;
  customFonts?: string[];
}

export interface UIContextValue {
  theme: ThemeConfig;
  setTheme: (config: ThemeConfig) => void;
}
