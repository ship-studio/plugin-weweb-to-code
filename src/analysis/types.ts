export interface VariableEntry {
  id: string;
  name: string;
  type: 'boolean' | 'string' | 'number' | 'array' | 'object' | 'query';
  defaultValue: unknown;
  isLocalStorage: boolean;
  isPersistentOnNav: boolean;
}

export interface CollectionEntry {
  id: string;
  name: string;
  type: 'single' | 'list';
  table: string; // from config.table
  pluginId: string;
}

export interface ActionSpec {
  type: string;
  name: string;
  varId?: string;
  varName?: string; // resolved from variables dict
  details?: Record<string, unknown>;
}

export interface WorkflowSpec {
  id: string;
  name: string;
  sourceType: 'page' | 'element';
  sourceName: string;
  trigger: string;
  triggerCondition?: string;
  actions: ActionSpec[];
}

export interface ParsedObject {
  uid: string;
  name: string | null;
  componentType: string; // from wwObjectBaseId lookup or name fallback
  wwObjectBaseId: string;
  isLibraryComponent: boolean;
  isDynamic: boolean; // has __wwtype binding on key content properties
  conditionalRendering?: string; // description if conditionally visible
  styleDefault: Record<string, unknown>;
  styleMobile?: Record<string, unknown>;
  styleTablet?: Record<string, unknown>;
  interactions: WorkflowSpec[];
  children: ParsedObject[]; // resolved subtree
  // Type-specific content (for known component types)
  textContent?: string | '[DYNAMIC]';
  imageUrl?: string | '[DYNAMIC]';
}

export interface ParsedSection {
  uid: string;
  sectionBaseId: string;
  title: string | null;
  isShared: boolean; // set by detectShared after cross-page analysis
  styleDefault: Record<string, unknown>;
  styleMobile?: Record<string, unknown>;
  styleTablet?: Record<string, unknown>;
  components: ParsedObject[]; // tree-walked, ordered
}

export interface ParsedPage {
  id: string; // UUID filename
  route: string; // normalized from page.paths.default
  isDynamic: boolean; // true if route contains [param]
  sections: Record<string, ParsedSection>;
  variables: VariableEntry[];
  collections: CollectionEntry[];
  workflows: WorkflowSpec[]; // page-level (page.workflows) + linearized
}

export interface SiteAnalysis {
  siteName: string; // from manifest.json name/short_name
  pages: ParsedPage[];
  sharedSections: Map<string, string>; // sectionBaseId -> title
  allVariables: VariableEntry[];
  allCollections: CollectionEntry[];
  totalComponentCount: number;
}
