import type { BriefInput, BriefResult, BriefStats, PreserveOption } from './types';
import type { SiteAnalysis, ParsedPage, ParsedSection, ParsedObject, WorkflowSpec } from '../analysis/types';
import type { DesignSystem, DesignToken } from '../design/types';
import type { AssetManifest } from '../assets/types';
import { PRESERVE_OPTIONS } from './types';

export function estimateTokens(markdown: string): number {
  return Math.ceil(markdown.length / 4);
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|');
}

// --- Component migration lookup ---

const COMPONENT_MIGRATION_NOTES: Record<string, string> = {
  Container: 'div (or semantic section/article)',
  Text: 'p or span',
  Image: 'img with alt text',
  Button: 'button or a',
  Link: 'a',
  Icon: 'svg or icon component',
  'Form Container': 'form',
  Input: 'input',
  Select: 'select',
  Columns: 'CSS grid or flexbox',
  Tabs: 'tab component (custom or library)',
  Map: 'map embed (iframe or library)',
  Video: 'video element',
  Slider: 'CSS scroll snap or lightweight carousel',
  Accordion: 'details/summary or custom JS',
  Modal: 'dialog element or custom modal',
  Navbar: 'nav with hamburger JS',
  Footer: 'footer element',
};

// --- Section builders ---

function buildMetadataSection(input: BriefInput): string {
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const modeLabel = input.mode === 'pixel-perfect' ? 'Pixel Perfect' : 'Best Site';
  const { pages, totalComponentCount, sharedSections } = input.siteAnalysis;
  const assetCount = input.assetManifest.images.length + input.assetManifest.icons.length;

  const lines = [
    '# WeWeb Migration Brief',
    '',
    `**Site:** ${input.siteAnalysis.siteName}`,
    `**Extracted:** ${date}`,
    `**Mode:** ${modeLabel}`,
    `**Pages:** ${pages.length}`,
    `**Components:** ${totalComponentCount}`,
    `**Assets:** ${assetCount} files copied to .shipstudio/assets/`,
    `**Shared sections:** ${sharedSections.size}`,
  ];
  return lines.join('\n');
}

function buildMigrationPlanSection(): string {
  return `## Migration Plan

The file \`.shipstudio/migration-plan.json\` will be generated alongside this brief. It contains all pages and sections from the site analysis with status \`"pending"\`.

**Before writing any code:**
1. Read \`.shipstudio/migration-plan.json\` to understand the full scope of work.
2. Do NOT recreate this file — it already exists. Do not overwrite it with a new structure.

**IMPORTANT — Update the plan file after EACH item you complete:**
- When you start an item: set its \`status\` to \`"in-progress"\` and write the file.
- When you finish an item: set its \`status\` to \`"complete"\` and write the file immediately — do not batch updates.
- The user is watching progress in real time. Update after every single item.

**Example of the file format:**
\`\`\`json
{
  "version": "1.0",
  "generatedAt": "2026-03-24",
  "items": [
    { "name": "Shared Nav", "type": "shared", "status": "pending" },
    {
      "name": "Home",
      "type": "page",
      "status": "in-progress",
      "children": [
        { "name": "Hero", "type": "section", "status": "complete" }
      ]
    }
  ]
}
\`\`\``;
}

function buildInstructionsSection(input: BriefInput): string {
  if (input.mode === 'pixel-perfect') {
    return `## How to Use This Brief

**Mode: pixel-perfect** — Reproduce the exact layout, spacing, and visual hierarchy from the WeWeb export.

**Instructions:**
- Use design tokens verbatim from the Design System section. Do not approximate or substitute values.
- Implement WeWeb interactive components (forms, tabs, sliders) as native HTML/JS equivalents.
- Preserve all layout relationships: grid columns, flex directions, gap values, and padding.
- Component types listed in the Component Migration Guidance section show the recommended native replacement.
- Shared sections (from the Shared Layout section) should be built once as shared components.`;
  }

  // Best Site mode
  const preserve = input.preserve ?? new Set<PreserveOption>();
  const activeOptions = PRESERVE_OPTIONS.filter((opt) => preserve.has(opt.key));
  const activeLabels = activeOptions.map((opt) => opt.label);

  const preserveSection = activeLabels.length > 0
    ? `\n\n**Preserve from original:** ${activeLabels.join(', ')}`
    : '';

  const customSection = input.customNotes?.trim()
    ? `\n\n**Additional instructions:**\n> ${input.customNotes.trim().replace(/\n/g, '\n> ')}`
    : '';

  return `## How to Use This Brief

**Mode: best-site** — Use this brief as reference. Modernize with relative units, semantic HTML, and component-based architecture.

**Instructions:**
- Use modern CSS (clamp, grid, flexbox with relative units) rather than exact pixel values.
- Replace WeWeb component types with semantic HTML5 elements and native implementations.
- Prioritize accessibility and performance alongside visual fidelity.${preserveSection}${customSection}`;
}

function buildOverviewSection(input: BriefInput): string {
  const { pages } = input.siteAnalysis;
  const lines: string[] = [
    '## Site Overview',
    '',
    '| Route | Sections | Components | Dynamic |',
    '|-------|----------|------------|---------|',
  ];

  let totalSections = 0;
  let totalComponents = 0;

  for (const page of pages) {
    const sections = Object.values(page.sections);
    const sectionCount = sections.length;
    const componentCount = sections.reduce((acc, s) => acc + s.components.length, 0);
    totalSections += sectionCount;
    totalComponents += componentCount;
    const dynamic = page.isDynamic ? 'Yes' : 'No';
    lines.push(`| ${escapeTableCell(page.route)} | ${sectionCount} | ${componentCount} | ${dynamic} |`);
  }

  lines.push(`| **Total** | **${totalSections}** | **${totalComponents}** | — |`);
  return lines.join('\n');
}

function buildDesignSystemSection(ds: DesignSystem): string {
  const lines: string[] = ['## Design System'];

  if (ds.fonts.length > 0) {
    lines.push('', '### Typography', '', '| Semantic | Size (px) | Weight | Line Height | Token UUID |', '|----------|-----------|--------|-------------|------------|');
    for (const token of ds.fonts) {
      const semantic = escapeTableCell(token.semanticLabel ?? token.uuid);
      const size = token.fontSizePx?.toString() ?? '—';
      const weight = token.fontWeight ?? '—';
      const lineHeight = token.lineHeight ?? '—';
      lines.push(`| ${semantic} | ${size} | ${weight} | ${lineHeight} | ${token.uuid} |`);
    }
  }

  if (ds.colors.length > 0) {
    lines.push('', '### Colors', '', '| Semantic | Value | Token UUID |', '|----------|-------|------------|');
    for (const token of ds.colors) {
      const semantic = escapeTableCell(token.semanticLabel ?? token.uuid);
      lines.push(`| ${semantic} | ${escapeTableCell(token.value)} | ${token.uuid} |`);
    }
  }

  if (ds.dimensions.length > 0) {
    lines.push('', '### Spacing & Dimensions', '', '| Value | Token UUID |', '|-------|------------|');
    for (const token of ds.dimensions) {
      const label = token.semanticLabel ? `${token.semanticLabel} (${token.value})` : token.value;
      lines.push(`| ${escapeTableCell(label)} | ${token.uuid} |`);
    }
  }

  if (ds.googleFontUrls.length > 0) {
    lines.push('', '### External Fonts', '');
    for (const url of ds.googleFontUrls) {
      lines.push(`- ${url}`);
    }
  }

  return lines.join('\n');
}

function buildSharedLayoutSection(sa: SiteAnalysis): string {
  if (sa.sharedSections.size === 0) {
    return '';
  }

  const lines: string[] = [
    '## Shared Layout',
    '',
    'These sections appear on more than 50% of pages. Build them once as shared components.',
    '',
    '| Section Base ID | Title |',
    '|-----------------|-------|',
  ];

  for (const [baseId, title] of sa.sharedSections) {
    lines.push(`| ${escapeTableCell(baseId)} | ${escapeTableCell(title)} |`);
  }

  return lines.join('\n');
}

function renderComponentTree(objects: ParsedObject[], depth: number, maxDepth: number): string {
  if (objects.length === 0) return '';

  const lines: string[] = [];
  const indent = '  '.repeat(depth);

  for (const obj of objects) {
    if (depth >= maxDepth) {
      // Emit collapsed note instead of recursing
      const total = countDescendants(obj);
      lines.push(`${indent}- ...(${total + 1} nested components)`);
      continue;
    }

    const dynamicBadge = obj.isDynamic ? ' [DYNAMIC]' : '';
    const libraryBadge = obj.isLibraryComponent ? ' *(library)*' : '';
    const namePart = obj.name ? ` -- ${escapeTableCell(obj.name)}` : '';
    lines.push(`${indent}- **${escapeTableCell(obj.componentType)}**${dynamicBadge}${libraryBadge}${namePart}`);

    if (obj.children.length > 0) {
      lines.push(renderComponentTree(obj.children, depth + 1, maxDepth));
    }
  }

  return lines.filter(Boolean).join('\n');
}

function countDescendants(obj: ParsedObject): number {
  return obj.children.reduce((acc, child) => acc + 1 + countDescendants(child), 0);
}

function renderBreakpointDiffs(section: ParsedSection): string {
  const lines: string[] = [];

  if (section.styleMobile && Object.keys(section.styleMobile).length > 0) {
    lines.push('', '**Mobile breakpoint overrides:**', '', '| Property | Value |', '|----------|-------|');
    for (const [key, val] of Object.entries(section.styleMobile)) {
      lines.push(`| ${escapeTableCell(key)} | ${escapeTableCell(String(val))} |`);
    }
  }

  if (section.styleTablet && Object.keys(section.styleTablet).length > 0) {
    lines.push('', '**Tablet breakpoint overrides:**', '', '| Property | Value |', '|----------|-------|');
    for (const [key, val] of Object.entries(section.styleTablet)) {
      lines.push(`| ${escapeTableCell(key)} | ${escapeTableCell(String(val))} |`);
    }
  }

  return lines.join('\n');
}

function renderWorkflows(workflows: WorkflowSpec[]): string {
  if (workflows.length === 0) return '';

  const lines: string[] = ['', '**Workflows:**'];

  for (const wf of workflows) {
    const condition = wf.triggerCondition ? ` (when: ${wf.triggerCondition})` : '';
    lines.push(``, `*${escapeTableCell(wf.name)}* — trigger: \`${wf.trigger}\`${condition}`);
    wf.actions.forEach((action, i) => {
      const varRef = action.varName ? ` → ${action.varName}` : action.varId ? ` → ${action.varId}` : '';
      lines.push(`${i + 1}. ${escapeTableCell(action.type)}${varRef}: ${escapeTableCell(action.name)}`);
    });
  }

  return lines.join('\n');
}

function buildPageSubsection(page: ParsedPage, input: BriefInput): string {
  const dynamicFlag = page.isDynamic ? ' [dynamic]' : '';
  const lines: string[] = [`### ${escapeTableCell(page.route)}${dynamicFlag}`];

  const sections = Object.values(page.sections).filter((s) => !s.isShared);

  for (const section of sections) {
    lines.push('');
    const title = section.title ? `**${escapeTableCell(section.title)}**` : `*(section: ${section.uid})*`;
    lines.push(title);

    if (section.components.length > 0) {
      const tree = renderComponentTree(section.components, 0, 3);
      if (tree) lines.push(tree);
    }

    const diffs = renderBreakpointDiffs(section);
    if (diffs) lines.push(diffs);
  }

  // Page-level workflows
  const wfText = renderWorkflows(page.workflows);
  if (wfText) lines.push(wfText);

  return lines.join('\n');
}

function buildPagesSection(input: BriefInput): string {
  const subsections = input.siteAnalysis.pages.map((page) => buildPageSubsection(page, input));
  return `## Pages\n\n${subsections.join('\n\n')}`;
}

function buildAssetsSection(am: AssetManifest): string {
  const lines: string[] = ['## Assets'];

  if (am.images.length > 0) {
    lines.push('', '### Images', '', '| Filename | Path |', '|----------|------|');
    for (const img of am.images) {
      lines.push(`| ${escapeTableCell(img.filename)} | ${escapeTableCell(img.projectRelativePath)} |`);
    }
  }

  if (am.icons.length > 0) {
    lines.push('', '### Icons', '', '| Filename | Path |', '|----------|------|');
    for (const icon of am.icons) {
      lines.push(`| ${escapeTableCell(icon.filename)} | ${escapeTableCell(icon.projectRelativePath)} |`);
    }
  }

  if (am.googleFonts.length > 0) {
    lines.push('', '### Fonts', '');
    for (const url of am.googleFonts) {
      lines.push(`- ${url}`);
    }
  }

  lines.push('', `Total assets copied: ${am.totalCopied}`);

  return lines.join('\n');
}

function collectComponentTypes(pages: ParsedPage[]): Set<string> {
  const types = new Set<string>();

  function walkObjects(objects: ParsedObject[]): void {
    for (const obj of objects) {
      types.add(obj.componentType);
      walkObjects(obj.children);
    }
  }

  for (const page of pages) {
    for (const section of Object.values(page.sections)) {
      walkObjects(section.components);
    }
  }

  return types;
}

function buildMigrationGuidanceSection(input: BriefInput): string {
  const componentTypes = collectComponentTypes(input.siteAnalysis.pages);
  const lines: string[] = [
    '## Component Migration Guidance',
    '',
    '| WeWeb Component | Recommended Replacement |',
    '|-----------------|-------------------------|',
  ];

  for (const componentType of componentTypes) {
    const note = COMPONENT_MIGRATION_NOTES[componentType] ?? 'Implement as custom component';
    lines.push(`| ${escapeTableCell(componentType)} | ${escapeTableCell(note)} |`);
  }

  return lines.join('\n');
}

// --- Main export ---

export function generateBrief(input: BriefInput): BriefResult {
  const sections = [
    buildMetadataSection(input),
    buildMigrationPlanSection(),
    buildInstructionsSection(input),
    buildOverviewSection(input),
    buildDesignSystemSection(input.designSystem),
    buildSharedLayoutSection(input.siteAnalysis),
    buildPagesSection(input),
    buildAssetsSection(input.assetManifest),
    buildMigrationGuidanceSection(input),
  ].filter(Boolean);

  const markdown = sections.join('\n\n');
  const est = estimateTokens(markdown);

  const stats: BriefStats = {
    pageCount: input.siteAnalysis.pages.length,
    totalComponentCount: input.siteAnalysis.totalComponentCount,
    assetCount: input.assetManifest.images.length + input.assetManifest.icons.length,
    estimatedTokens: est,
  };

  return {
    markdown,
    charCount: markdown.length,
    estimatedTokens: est,
    stats,
  };
}
