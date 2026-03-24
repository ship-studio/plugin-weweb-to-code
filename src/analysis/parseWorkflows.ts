import type { ActionSpec, WorkflowSpec, VariableEntry, CollectionEntry } from './types';

/**
 * Walks a flat action-dict via firstActionId -> next -> next pointers.
 * Guards against cycles with a visited Set.
 * Returns ordered ActionSpec[].
 */
export function linearizeWorkflowChain(
  firstActionId: string | undefined,
  actionsMap: Record<string, unknown>,
  variableIndex: Map<string, string> = new Map()
): ActionSpec[] {
  if (!firstActionId) return [];

  const chain: ActionSpec[] = [];
  const visited = new Set<string>();
  let current: string | undefined = firstActionId;

  while (current && !visited.has(current)) {
    visited.add(current);
    const action = actionsMap[current] as Record<string, unknown> | undefined;
    if (!action) break;

    const type = (action.type as string) ?? 'unknown';
    const name = (action.name as string) ?? (action.type as string) ?? 'unnamed';

    const spec: ActionSpec = { type, name };

    // Resolve variable ID for 'variable' action type
    if (type === 'variable') {
      const varId =
        (action.wwpiId as string | undefined) ??
        (action.variableId as string | undefined) ??
        (action.id as string | undefined);
      if (varId) {
        spec.varId = varId;
        const resolved = variableIndex.get(varId);
        if (resolved) spec.varName = resolved;
      }
    }

    // Extract relevant details for known action types
    if (type === 'fetch-collection' || type === 'fetch-collections') {
      const details: Record<string, unknown> = {};
      if (action.collectionId) details.collectionId = action.collectionId;
      if (action.collectionIds) details.collectionIds = action.collectionIds;
      spec.details = details;
    } else if (type === 'custom-js') {
      const details: Record<string, unknown> = {};
      if (action.code) details.code = action.code;
      spec.details = details;
    } else if (type === 'change-page') {
      const details: Record<string, unknown> = {};
      if (action.pageId) details.pageId = action.pageId;
      if (action.parameters) details.parameters = action.parameters;
      spec.details = details;
    } else if (type === 'if') {
      const details: Record<string, unknown> = {};
      if (action.condition) details.condition = action.condition;
      if (action.thenAction) details.thenAction = action.thenAction;
      if (action.elseAction) details.elseAction = action.elseAction;
      spec.details = details;
    } else if (type === 'switch') {
      const details: Record<string, unknown> = {};
      if (action.expression) details.expression = action.expression;
      if (action.cases) details.cases = action.cases;
      spec.details = details;
    }

    chain.push(spec);
    current = action.next as string | undefined;
  }

  return chain;
}

/**
 * Creates a Map<variableId, variableName> for resolving IDs to human-readable names.
 */
export function buildVariableIndex(
  variables: Array<{ id: string; name: string }>
): Map<string, string> {
  const index = new Map<string, string>();
  for (const v of variables) {
    index.set(v.id, v.name);
  }
  return index;
}

/**
 * Parses page.page.workflows[] into WorkflowSpec[] with sourceType 'page'.
 * NOTE: Read from page.page.workflows, NOT page.workflows (which is always empty).
 */
export function parsePageWorkflows(
  pageWorkflows: unknown[],
  pageName: string,
  variableIndex: Map<string, string>
): WorkflowSpec[] {
  return pageWorkflows.map((raw) => {
    const wf = raw as Record<string, unknown>;
    const spec: WorkflowSpec = {
      id: wf.id as string,
      name: (wf.name as string) ?? 'unnamed workflow',
      sourceType: 'page',
      sourceName: pageName,
      trigger: (wf.trigger as string) ?? 'unknown',
      actions: linearizeWorkflowChain(
        wf.firstAction as string | undefined,
        (wf.actions as Record<string, unknown>) ?? {},
        variableIndex
      ),
    };

    const triggerConds = wf.triggerConditions as Record<string, unknown> | null | undefined;
    if (triggerConds && typeof triggerConds === 'object' && triggerConds.__wwtype) {
      spec.triggerCondition = `[DYNAMIC: ${triggerConds.__wwtype}]`;
    }

    return spec;
  });
}

/**
 * Parses wwObject._state.interactions[] into WorkflowSpec[] with sourceType 'element'.
 */
export function parseElementInteractions(
  interactions: unknown[],
  elementName: string,
  variableIndex: Map<string, string>
): WorkflowSpec[] {
  return interactions.map((raw) => {
    const interaction = raw as Record<string, unknown>;
    const spec: WorkflowSpec = {
      id: interaction.id as string,
      name:
        (interaction.name as string) ??
        (interaction.trigger as string) ??
        'unnamed',
      sourceType: 'element',
      sourceName: elementName,
      trigger: (interaction.trigger as string) ?? 'unknown',
      actions: linearizeWorkflowChain(
        interaction.firstAction as string | undefined,
        (interaction.actions as Record<string, unknown>) ?? {},
        variableIndex
      ),
    };

    const triggerConds = interaction.triggerConditions as Record<string, unknown> | null | undefined;
    if (triggerConds && typeof triggerConds === 'object' && triggerConds.__wwtype) {
      spec.triggerCondition = `[DYNAMIC: ${triggerConds.__wwtype}]`;
    }

    return spec;
  });
}

/**
 * Maps raw variable objects from the WeWeb page JSON to VariableEntry[].
 */
export function parseVariables(rawVars: unknown[]): VariableEntry[] {
  return rawVars.map((raw) => {
    const v = raw as Record<string, unknown>;
    return {
      id: v.id as string,
      name: (v.name as string) ?? 'unnamed',
      type: (v.type as VariableEntry['type']) ?? 'string',
      defaultValue: v.defaultValue ?? null,
      isLocalStorage: !!v.isLocalStorage,
      isPersistentOnNav: !!v.isPersistentOnNav,
    };
  });
}

/**
 * Maps raw collection objects from the WeWeb page JSON to CollectionEntry[].
 */
export function parseCollections(rawColls: unknown[]): CollectionEntry[] {
  return rawColls.map((raw) => {
    const c = raw as Record<string, unknown>;
    const config = c.config as Record<string, unknown> | undefined;
    return {
      id: c.id as string,
      name: (c.name as string) ?? 'unnamed',
      type: c.mode === 'single' ? 'single' : 'list',
      table: (config?.table as string) ?? '',
      pluginId: (c.pluginId as string) ?? '',
    };
  });
}
