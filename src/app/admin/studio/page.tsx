import { CardsTab } from "@/components/admin/appearance/cards-tab";
import { ContactTab, ContentTab } from "@/components/admin/appearance/content-tab";
import { FooterTab, HeaderTab } from "@/components/admin/appearance/header-tab";
import { LayoutTab } from "@/components/admin/appearance/layout-tab";
import { PagesTab } from "@/components/admin/appearance/pages-tab";
import { PreviewLayout } from "@/components/admin/appearance/preview";
import { SearchTab } from "@/components/admin/appearance/search-tab";
import { SectionsTab } from "@/components/admin/appearance/sections-tab";
import { ShoppingTab } from "@/components/admin/appearance/shopping-tab";
import { VisibilityTab } from "@/components/admin/appearance/visibility-tab";
import { listProductsForPicker } from "@/services/merch.service";
import { getCategories } from "@/services/catalog.service";
import { StyleTab } from "@/components/admin/appearance/style-tab";
import { ThemeTab } from "@/components/admin/appearance/theme-tab";
import { PageHeader } from "@/components/admin/ui";
import { LabelsTab } from "@/components/admin/appearance/labels-tab";
import { StudioNav } from "@/components/admin/appearance/studio-nav";
import { STUDIO_TABS, type StudioTab } from "@/components/admin/appearance/studio-tabs";
import { getTheme } from "@/config/themes";
import { connectDB } from "@/lib/db/connect";
import { Setting } from "@/models";
import { previewPages } from "@/services/admin/preview-pages";
import { getSiteConfig } from "@/services/site-config.service";

export const metadata = { title: "Studio" };

type Tab = StudioTab;

const PREVIEW_FIRST: Partial<Record<Tab, "/" | "/contact" | "/search" | "category">> = { contact: "/contact", pages: "category", search: "/search" };

/**
 * Admin → Studio: the theme plus everything layered on top of it. Each tab
 * saves its own section. The live preview stays open across tabs, and
 * clicking a part of the preview opens the panel that edits it.
 */
export default async function StudioPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: raw } = await searchParams;
  const tab: Tab = (STUDIO_TABS as readonly string[]).includes(raw ?? "") ? (raw as Tab) : "theme";
  await connectDB();
  const [site, saved, pages, categories, pickerProducts] = await Promise.all([
    getSiteConfig(),
    Setting.findOne({ key: "store" }).select("theme").lean<{ theme?: string }>(),
    previewPages(PREVIEW_FIRST[tab] ?? "/"),
    getCategories(),
    tab === "shopping" || tab === "content" ? listProductsForPicker() : Promise.resolve([]),
  ]);
  // The theme's own defaults (without overrides), to show what "Theme default" means.
  const theme = getTheme(saved?.theme);

  return (
    <>
      <PageHeader
        title="Studio"
        description={
          <>
            Design your store: pick a theme (now <strong>{theme.name}</strong>), then edit any part of it. Open the live preview and click anything on
            the page to jump to its settings. Visitors see changes when you save.
            <br />
            <span className="text-xs">
              Layout, fonts, colours, effects and product cards are saved for <strong>{theme.name}</strong> only; other themes keep their own look. Sections, text,
              header, footer and search are shared by all themes.
            </span>
          </>
        }
      />
      <StudioNav current={tab} />
      <PreviewLayout pages={pages}>
        {/* key: remount a tab after saving / switching so it shows the stored values */}
        <div key={tab}>
          {tab === "theme" && <ThemeTab initial={theme.id} />}
          {tab === "sections" && (
            <SectionsTab
              initial={site.builder}
              landing={{ on: site.design.sections, order: site.design.sectionOrder === "theme" ? theme.layout.sections : site.design.sectionOrder }}
              categories={categories.flatMap((c) => [{ slug: c.slug, name: c.name }, ...c.children.map((k) => ({ slug: k.slug, name: `${c.name} › ${k.name}` }))])}
            />
          )}
          {tab === "layout" && <LayoutTab initial={site.design} theme={theme} builder={site.builder} />}
          {tab === "style" && <StyleTab initial={site.design} theme={theme} />}
          {tab === "cards" && <CardsTab initial={site.cards} theme={theme} />}
          {tab === "header" && <HeaderTab header={site.header} logo={site.logo} />}
          {tab === "footer" && <FooterTab initial={site.footer} />}
          {tab === "pages" && <PagesTab initial={site.pages} theme={theme} />}
          {tab === "search" && <SearchTab initial={site.search} theme={theme} />}
          {tab === "content" && <ContentTab initial={site.content} products={pickerProducts} />}
          {tab === "labels" && <LabelsTab initial={site.labels} />}
          {tab === "contact" && <ContactTab initial={site.contactForm} />}
          {tab === "shopping" && <ShoppingTab initial={site.shopping} products={pickerProducts} />}
          {tab === "visibility" && <VisibilityTab initial={site.visibility} />}
        </div>
      </PreviewLayout>
    </>
  );
}
