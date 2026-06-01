/// <reference types="vite/client" />

// Explicit augmentation so tsc always recognises import.meta.env
// regardless of which tsconfig or node_modules resolution is used
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
