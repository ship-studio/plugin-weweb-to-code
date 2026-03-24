// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SiteAnalysis, ParsedPage, ParsedSection } from '../analysis/types';
import { generateMigrationPlan } from './generate';

function makeSection(
  uid: string,
  title: string | null,
  isShared: boolean,
): ParsedSection {
  return {
    uid,
    sectionBaseId: uid,
    title,
    isShared,
    styleDefault: {},
    components: [],
  };
}

function makePage(
  id: string,
  route: string,
  sections: Record<string, ParsedSection>,
): ParsedPage {
  return {
    id,
    route,
    isDynamic: false,
    sections,
    variables: [],
    collections: [],
    workflows: [],
  };
}

function makeSiteAnalysis(overrides?: Partial<SiteAnalysis>): SiteAnalysis {
  const base: SiteAnalysis = {
    siteName: 'Test Site',
    pages: [],
    sharedSections: new Map(),
    allVariables: [],
    allCollections: [],
    totalComponentCount: 0,
  };
  return { ...base, ...overrides };
}

describe('generateMigrationPlan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Test 1: empty site produces { version: 1.0, generatedAt, items: [] }', () => {
    const result = generateMigrationPlan(makeSiteAnalysis());
    expect(result.version).toBe('1.0');
    expect(result.generatedAt).toBe('2026-03-24');
    expect(result.items).toEqual([]);
  });

  it('Test 2: shared sections from Map become items with type shared and status pending', () => {
    const sharedSections = new Map([
      ['nav-base', { title: 'Navigation', pageCount: 2, totalPages: 2, type: 'nav' as const }],
      ['footer-base', { title: 'Footer', pageCount: 2, totalPages: 2, type: 'footer' as const }],
    ]);
    const result = generateMigrationPlan(makeSiteAnalysis({ sharedSections }));
    const shared = result.items.filter(i => i.type === 'shared');
    expect(shared).toHaveLength(2);
    expect(shared[0].status).toBe('pending');
    expect(shared[1].status).toBe('pending');
  });

  it('Test 2b: shared section ordering — nav first, footer last', () => {
    const sharedSections = new Map([
      ['footer-base', { title: 'Footer', pageCount: 2, totalPages: 2, type: 'footer' as const }],
      ['sidebar-base', { title: 'Sidebar', pageCount: 2, totalPages: 2, type: 'sidebar' as const }],
      ['nav-base', { title: 'Navigation', pageCount: 2, totalPages: 2, type: 'nav' as const }],
    ]);
    const result = generateMigrationPlan(makeSiteAnalysis({ sharedSections }));
    const names = result.items.map(i => i.name);
    expect(names[0]).toBe('Navigation');
    expect(names[names.length - 1]).toBe('Footer');
  });

  it('Test 3: each page becomes a PlanItem with type page; non-shared sections become children', () => {
    const sections: Record<string, ParsedSection> = {
      'sec-1': makeSection('sec-1', 'Hero', false),
      'sec-2': makeSection('sec-2', 'Content', false),
    };
    const pages = [makePage('page-1', '/home', sections)];
    const result = generateMigrationPlan(makeSiteAnalysis({ pages }));
    const homePage = result.items.find(i => i.name === '/home');
    expect(homePage).toBeDefined();
    expect(homePage!.type).toBe('page');
    expect(homePage!.children).toHaveLength(2);
  });

  it('Test 4: sections with isShared=true are excluded from page children', () => {
    const sections: Record<string, ParsedSection> = {
      'sec-shared': makeSection('sec-shared', 'Nav', true),
      'sec-1': makeSection('sec-1', 'Hero', false),
    };
    const pages = [makePage('page-1', '/home', sections)];
    const result = generateMigrationPlan(makeSiteAnalysis({ pages }));
    const homePage = result.items.find(i => i.name === '/home');
    expect(homePage!.children).toHaveLength(1);
    expect(homePage!.children![0].name).toBe('Hero');
  });

  it('Test 5: generatedAt is ISO date string in YYYY-MM-DD format', () => {
    const result = generateMigrationPlan(makeSiteAnalysis());
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.generatedAt).toBe('2026-03-24');
  });

  it('Test 6: page with zero non-shared sections has no children property', () => {
    const sections: Record<string, ParsedSection> = {
      'sec-shared': makeSection('sec-shared', 'Nav', true),
    };
    const pages = [makePage('page-1', '/about', sections)];
    const result = generateMigrationPlan(makeSiteAnalysis({ pages }));
    const aboutPage = result.items.find(i => i.name === '/about');
    expect(aboutPage).toBeDefined();
    expect(aboutPage!.children).toBeUndefined();
  });

  it('section child uses section.uid as name when title is null', () => {
    const sections: Record<string, ParsedSection> = {
      'sec-uid-123': makeSection('sec-uid-123', null, false),
    };
    const pages = [makePage('page-1', '/home', sections)];
    const result = generateMigrationPlan(makeSiteAnalysis({ pages }));
    const homePage = result.items.find(i => i.name === '/home');
    expect(homePage!.children![0].name).toBe('sec-uid-123');
  });
});
