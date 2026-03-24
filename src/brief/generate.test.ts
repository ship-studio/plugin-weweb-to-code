import { describe, it, expect } from 'vitest';
import type { BriefInput } from './types';
import type { SiteAnalysis, ParsedPage, ParsedSection, ParsedObject, WorkflowSpec } from '../analysis/types';
import type { DesignSystem, DesignToken } from '../design/types';
import type { AssetManifest } from '../assets/types';
import { generateBrief, estimateTokens } from './generate';

// --- Fixture helpers ---

function makeSharedSection(uid: string, title: string): ParsedSection {
  return {
    uid,
    sectionBaseId: `base-${uid}`,
    title,
    isShared: true,
    styleDefault: {},
    components: [],
  };
}

function makeSection(uid: string, title: string, components: ParsedObject[] = []): ParsedSection {
  return {
    uid,
    sectionBaseId: `base-${uid}`,
    title,
    isShared: false,
    styleDefault: {},
    components,
  };
}

function makeComponent(
  uid: string,
  componentType: string,
  name: string | null = null,
  children: ParsedObject[] = [],
  overrides: Partial<ParsedObject> = {},
): ParsedObject {
  return {
    uid,
    name,
    componentType,
    wwObjectBaseId: `base-${uid}`,
    isLibraryComponent: false,
    isDynamic: false,
    styleDefault: {},
    interactions: [],
    children,
    ...overrides,
  };
}

function makeWorkflow(id: string, trigger: string): WorkflowSpec {
  return {
    id,
    name: `Workflow ${id}`,
    sourceType: 'element',
    sourceName: 'Button',
    trigger,
    actions: [
      { type: 'set-variable', name: 'Set isOpen', varId: 'v1', varName: 'isOpen' },
      { type: 'navigate', name: 'Navigate home' },
    ],
  };
}

function makeMockInput(overrides?: Partial<BriefInput>): BriefInput {
  const navSection = makeSharedSection('nav-uid', 'Navigation');
  const heroSection = makeSection('hero-uid', 'Hero', [
    makeComponent('btn-1', 'Button', 'CTA Button'),
    makeComponent('text-1', 'Text', 'Headline'),
  ]);
  const featureSection = makeSection('feat-uid', 'Features', [
    makeComponent('cont-1', 'Container', null, [
      makeComponent('img-1', 'Image', 'Feature Image', [], { isDynamic: true }),
      makeComponent('text-2', 'Text', null),
    ]),
  ]);

  const page1: ParsedPage = {
    id: 'page-uuid-1',
    route: '/',
    isDynamic: false,
    sections: {
      'nav-uid': navSection,
      'hero-uid': heroSection,
      'feat-uid': featureSection,
    },
    variables: [],
    collections: [],
    workflows: [makeWorkflow('wf-1', 'click')],
  };

  const page2: ParsedPage = {
    id: 'page-uuid-2',
    route: '/about',
    isDynamic: false,
    sections: {
      'nav-uid': { ...navSection },
      'about-uid': makeSection('about-uid', 'About Hero'),
    },
    variables: [],
    collections: [],
    workflows: [],
  };

  const dynamicPage: ParsedPage = {
    id: 'page-uuid-3',
    route: '/products/[slug]',
    isDynamic: true,
    sections: {},
    variables: [],
    collections: [],
    workflows: [],
  };

  const siteAnalysis: SiteAnalysis = {
    siteName: 'Test Site',
    pages: [page1, page2, dynamicPage],
    sharedSections: new Map([['base-nav-uid', { title: 'Navigation', pageCount: 8, totalPages: 10, type: 'nav' as const }]]),
    allVariables: [],
    allCollections: [],
    totalComponentCount: 5,
  };

  const fontToken: DesignToken = {
    uuid: 'uuid-font-1',
    value: '700 24px/1.2 Inter',
    type: 'font',
    fontSizePx: 24,
    fontWeight: '700',
    lineHeight: '1.2',
    semanticLabel: 'h1',
  };

  const colorToken: DesignToken = {
    uuid: 'uuid-color-1',
    value: '#3b82f6',
    type: 'color',
    semanticLabel: 'primary',
  };

  const dimToken: DesignToken = {
    uuid: 'uuid-dim-1',
    value: '16px',
    type: 'dimension',
    semanticLabel: 'spacing-md',
  };

  const designSystem: DesignSystem = {
    fonts: [fontToken],
    colors: [colorToken],
    dimensions: [dimToken],
    raw: [],
    googleFontUrls: ['https://fonts.googleapis.com/css2?family=Inter'],
  };

  const assetManifest: AssetManifest = {
    images: [
      { filename: 'hero.jpg', projectRelativePath: '.shipstudio/assets/images/hero.jpg' },
      { filename: 'logo.svg', projectRelativePath: '.shipstudio/assets/images/logo.svg' },
    ],
    icons: [
      { filename: 'arrow.svg', projectRelativePath: '.shipstudio/assets/icons/arrow.svg' },
    ],
    googleFonts: ['https://fonts.googleapis.com/css2?family=Inter'],
    totalCopied: 3,
  };

  return {
    mode: 'pixel-perfect',
    siteAnalysis,
    designSystem,
    assetManifest,
    projectPath: '/tmp/test-project',
    date: '2026-03-24',
    ...overrides,
  };
}

// --- Tests ---

describe('estimateTokens', () => {
  it('returns 1 for a 4-char string', () => {
    expect(estimateTokens('abcd')).toBe(1);
  });

  it('returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('returns Math.ceil(length / 4) for non-multiple', () => {
    // 5 chars -> Math.ceil(5/4) = 2
    expect(estimateTokens('abcde')).toBe(2);
  });

  it('returns correct value for 12-char string', () => {
    expect(estimateTokens('abcdefghijkl')).toBe(3);
  });
});

describe('generateBrief - returns BriefResult', () => {
  it('returns object with markdown, charCount, estimatedTokens, stats', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toBeTruthy();
    expect(result.charCount).toBeGreaterThan(0);
    expect(result.estimatedTokens).toBeGreaterThan(0);
    expect(result.stats).toBeDefined();
  });

  it('charCount matches markdown length', () => {
    const result = generateBrief(makeMockInput());
    expect(result.charCount).toBe(result.markdown.length);
  });

  it('estimatedTokens = Math.ceil(charCount / 4)', () => {
    const result = generateBrief(makeMockInput());
    expect(result.estimatedTokens).toBe(Math.ceil(result.charCount / 4));
  });

  it('stats has correct pageCount', () => {
    const input = makeMockInput();
    const result = generateBrief(input);
    expect(result.stats.pageCount).toBe(input.siteAnalysis.pages.length);
  });

  it('stats has correct totalComponentCount', () => {
    const input = makeMockInput();
    const result = generateBrief(input);
    expect(result.stats.totalComponentCount).toBe(input.siteAnalysis.totalComponentCount);
  });

  it('stats has correct assetCount (images + icons)', () => {
    const input = makeMockInput();
    const result = generateBrief(input);
    const expected = input.assetManifest.images.length + input.assetManifest.icons.length;
    expect(result.stats.assetCount).toBe(expected);
  });
});

describe('generateBrief - metadata section', () => {
  it('markdown contains "# WeWeb Migration Brief" heading', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('# WeWeb Migration Brief');
  });

  it('markdown contains the site name', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Test Site');
  });

  it('markdown contains the date', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('2026-03-24');
  });
});

describe('generateBrief - design system section', () => {
  it('markdown contains "## Design System" heading', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('## Design System');
  });

  it('markdown contains typography subsection with semantic label', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('### Typography');
    expect(result.markdown).toContain('h1');
  });

  it('markdown contains colors subsection with semantic label', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('### Colors');
    expect(result.markdown).toContain('primary');
    expect(result.markdown).toContain('#3b82f6');
  });

  it('markdown contains spacing/dimensions subsection', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('### Spacing');
    expect(result.markdown).toContain('16px');
  });

  it('markdown contains external fonts subsection when googleFontUrls non-empty', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('### External Fonts');
    expect(result.markdown).toContain('fonts.googleapis.com');
  });

  it('typography section absent when no fonts', () => {
    const input = makeMockInput();
    input.designSystem = { ...input.designSystem, fonts: [] };
    const result = generateBrief(input);
    expect(result.markdown).not.toContain('### Typography');
  });

  it('colors section absent when no colors', () => {
    const input = makeMockInput();
    input.designSystem = { ...input.designSystem, colors: [] };
    const result = generateBrief(input);
    expect(result.markdown).not.toContain('### Colors');
  });
});

describe('generateBrief - shared layout section', () => {
  it('markdown contains "## Shared Layout" when sharedSections non-empty', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('## Shared Layout');
  });

  it('shared layout section absent when sharedSections is empty', () => {
    const input = makeMockInput();
    input.siteAnalysis = { ...input.siteAnalysis, sharedSections: new Map() };
    const result = generateBrief(input);
    expect(result.markdown).not.toContain('## Shared Layout');
  });

  it('shared layout table contains the section title', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Navigation');
  });
});

describe('generateBrief - pages section', () => {
  it('markdown contains "## Pages" heading', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('## Pages');
  });

  it('per-page subsection has route as heading', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('### /');
    expect(result.markdown).toContain('### /about');
  });

  it('dynamic page is labeled with dynamic flag', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('[dynamic]');
  });

  it('shared sections are NOT rendered in per-page output', () => {
    const result = generateBrief(makeMockInput());
    // The nav section title 'Navigation' should only appear in shared layout, not per-page
    // We check by looking at content after page subsection heading
    const pageIdx = result.markdown.indexOf('### /\n');
    const aboutIdx = result.markdown.indexOf('### /about');
    const pagePart = result.markdown.slice(pageIdx, aboutIdx);
    // 'Navigation' (the shared section) should NOT appear under the page section
    expect(pagePart).not.toContain('**Navigation**');
  });

  it('non-shared sections ARE rendered in per-page output', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Hero');
    expect(result.markdown).toContain('Features');
  });

  it('component tree renders componentType', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Button');
    expect(result.markdown).toContain('Text');
  });

  it('component tree renders [DYNAMIC] badge for dynamic components', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('[DYNAMIC]');
  });

  it('component tree caps at depth 3 with "(+N nested)" note', () => {
    // Create a deeply nested tree: depth 0 -> 1 -> 2 -> 3 (should be cut)
    const deep3 = makeComponent('d3', 'Text', 'Level 3');
    const deep2 = makeComponent('d2', 'Container', 'Level 2', [deep3]);
    const deep1 = makeComponent('d1', 'Container', 'Level 1', [deep2]);
    const deep0 = makeComponent('d0', 'Container', 'Level 0', [deep1]);
    const section = makeSection('deep-sec', 'Deep Section', [deep0]);
    const input = makeMockInput();
    const page: ParsedPage = {
      id: 'deep-page',
      route: '/deep',
      isDynamic: false,
      sections: { 'deep-sec': section },
      variables: [],
      collections: [],
      workflows: [],
    };
    input.siteAnalysis = { ...input.siteAnalysis, pages: [page] };
    const result = generateBrief(input);
    // At depth 3, should emit "(+N nested)" instead of the actual child name
    expect(result.markdown).toContain('nested');
    expect(result.markdown).not.toContain('Level 3');
  });

  it('responsive breakpoint diffs only emitted when styleMobile/styleTablet is non-empty', () => {
    const sectionWithBreakpoints = makeSection('break-sec', 'Break Section', []);
    sectionWithBreakpoints.styleMobile = { display: 'none' };
    sectionWithBreakpoints.styleTablet = {};

    const sectionNoBreakpoints = makeSection('no-break-sec', 'No Break Section', []);

    const page: ParsedPage = {
      id: 'break-page',
      route: '/break',
      isDynamic: false,
      sections: {
        'break-sec': sectionWithBreakpoints,
        'no-break-sec': sectionNoBreakpoints,
      },
      variables: [],
      collections: [],
      workflows: [],
    };
    const input = makeMockInput();
    input.siteAnalysis = { ...input.siteAnalysis, pages: [page] };
    const result = generateBrief(input);
    // Mobile breakpoint diff should appear (styleMobile has keys)
    expect(result.markdown).toContain('display');
    // Tablet should not appear (empty object)
    expect(result.markdown).not.toContain('styleTablet');
  });

  it('workflow specs rendered with trigger and action chain', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('click');
    expect(result.markdown).toContain('set-variable');
  });
});

describe('generateBrief - mode-gated instructions', () => {
  it('pixel-perfect mode includes exact-reproduction instructions', () => {
    const result = generateBrief(makeMockInput({ mode: 'pixel-perfect' }));
    expect(result.markdown).toContain('exact');
    expect(result.markdown).toContain('pixel-perfect');
  });

  it('best-site mode includes modernization instructions', () => {
    const result = generateBrief(makeMockInput({ mode: 'best-site' }));
    expect(result.markdown).toContain('best-site');
    expect(result.markdown).toContain('modern');
  });

  it('best-site mode with preserve options lists active options', () => {
    const result = generateBrief(makeMockInput({
      mode: 'best-site',
      preserve: new Set(['brand-colors', 'exact-layouts']),
    }));
    expect(result.markdown).toContain('Brand colors');
    expect(result.markdown).toContain('Exact layouts');
  });

  it('best-site mode with customNotes includes notes as blockquote', () => {
    const result = generateBrief(makeMockInput({
      mode: 'best-site',
      customNotes: 'Use Tailwind CSS for styling.',
    }));
    expect(result.markdown).toContain('Use Tailwind CSS for styling.');
  });
});

describe('generateBrief - assets section', () => {
  it('markdown contains "## Assets" heading', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('## Assets');
  });

  it('images table contains filename and path', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('hero.jpg');
    expect(result.markdown).toContain('.shipstudio/assets/images/hero.jpg');
  });

  it('icons table contains filename and path', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('arrow.svg');
    expect(result.markdown).toContain('.shipstudio/assets/icons/arrow.svg');
  });

  it('fonts list contains google font URL', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('fonts.googleapis.com');
  });

  it('total assets copied line present', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Total assets copied: 3');
  });
});

describe('generateBrief - migration guidance section', () => {
  it('markdown contains "## Component Migration Guidance" heading', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('## Component Migration Guidance');
  });

  it('contains Button migration note', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Button');
  });

  it('contains Text migration note', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Text');
  });

  it('contains Container migration note', () => {
    const result = generateBrief(makeMockInput());
    expect(result.markdown).toContain('Container');
  });
});

describe('escapeTableCell', () => {
  it('page title with pipe character does not break markdown table', () => {
    const input = makeMockInput();
    // Add a section with a pipe in the title
    const sectionWithPipe = makeSection('pipe-sec', 'A | B Section');
    const page: ParsedPage = {
      id: 'pipe-page',
      route: '/pipe',
      isDynamic: false,
      sections: { 'pipe-sec': sectionWithPipe },
      variables: [],
      collections: [],
      workflows: [],
    };
    input.siteAnalysis = { ...input.siteAnalysis, pages: [page] };
    const result = generateBrief(input);
    // The pipe should be escaped (\\|) in table cells
    expect(result.markdown).toContain('A \\| B');
  });
});
