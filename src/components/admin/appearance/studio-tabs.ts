/** Every Studio tab (shared by the server page and the client navigation). */
export const STUDIO_TABS = ["theme", "style", "cards", "sections", "layout", "content", "header", "footer", "pages", "visibility", "labels", "contact", "search", "shopping"] as const;
export type StudioTab = (typeof STUDIO_TABS)[number];
