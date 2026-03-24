import type { SiteAnalysis } from '../analysis/types';
import type { MigrationPlan, PlanItem } from './types';

// Sort order for shared section types: nav/header first, sidebar middle, footer last
const SHARED_TYPE_ORDER: Record<string, number> = {
  nav: 0,
  header: 1,
  sidebar: 2,
  shared: 3,
  footer: 4,
};

export function generateMigrationPlan(siteAnalysis: SiteAnalysis): MigrationPlan {
  const items: PlanItem[] = [];

  // Shared sections first — sorted by type order (nav/header first, footer last)
  const sharedEntries = Array.from(siteAnalysis.sharedSections.entries());
  sharedEntries.sort(([, a], [, b]) => {
    const orderA = SHARED_TYPE_ORDER[a.type] ?? 3;
    const orderB = SHARED_TYPE_ORDER[b.type] ?? 3;
    return orderA - orderB;
  });

  for (const [, info] of sharedEntries) {
    items.push({
      name: info.title,
      type: 'shared',
      status: 'pending',
    });
  }

  // Pages second — each page with its non-shared sections as children
  for (const page of siteAnalysis.pages) {
    const nonSharedSections = Object.values(page.sections).filter(s => !s.isShared);
    const children: PlanItem[] = nonSharedSections.map(s => ({
      name: s.title ?? s.uid,
      type: 'section' as const,
      status: 'pending' as const,
    }));

    items.push({
      name: page.route,
      type: 'page',
      status: 'pending',
      children: children.length > 0 ? children : undefined,
    });
  }

  return {
    version: '1.0',
    generatedAt: new Date().toISOString().slice(0, 10),
    items,
  };
}
