import { describe, it, expect } from 'vitest';
import {
  linearizeWorkflowChain,
  buildVariableIndex,
  parsePageWorkflows,
  parseElementInteractions,
  parseVariables,
  parseCollections,
} from './parseWorkflows';

describe('linearizeWorkflowChain', () => {
  it('walks a 3-action chain in order', () => {
    const actionsMap = {
      a1: { type: 'variable', name: 'Set token', next: 'a2' },
      a2: { type: 'fetch-collection', name: 'Load data', next: 'a3' },
      a3: { type: 'return', name: 'Done' },
    };
    const result = linearizeWorkflowChain('a1', actionsMap);
    expect(result).toHaveLength(3);
    expect(result[0].type).toBe('variable');
    expect(result[0].name).toBe('Set token');
    expect(result[1].type).toBe('fetch-collection');
    expect(result[1].name).toBe('Load data');
    expect(result[2].type).toBe('return');
    expect(result[2].name).toBe('Done');
  });

  it('handles cycles — does not loop infinitely', () => {
    const actionsMap = {
      a1: { type: 'log', name: 'A1', next: 'a2' },
      a2: { type: 'log', name: 'A2', next: 'a1' },
    };
    const result = linearizeWorkflowChain('a1', actionsMap);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for undefined firstActionId', () => {
    const result = linearizeWorkflowChain(undefined, {});
    expect(result).toEqual([]);
  });

  it('returns empty array for nonexistent firstActionId', () => {
    const result = linearizeWorkflowChain('nonexistent', {});
    expect(result).toEqual([]);
  });
});

describe('buildVariableIndex', () => {
  it('creates id->name map', () => {
    const index = buildVariableIndex([
      { id: 'v1', name: 'authToken' },
      { id: 'v2', name: 'isLoggedIn' },
    ]);
    expect(index.get('v1')).toBe('authToken');
    expect(index.get('v2')).toBe('isLoggedIn');
  });
});

describe('parsePageWorkflows', () => {
  it('creates WorkflowSpec with sourceType "page"', () => {
    const variableIndex = new Map<string, string>();
    const rawWorkflows = [
      {
        id: 'wf1',
        name: 'On Load',
        trigger: 'onload',
        firstAction: 'a1',
        actions: {
          a1: { type: 'log', name: 'Log something' },
        },
        triggerConditions: null,
      },
    ];
    const result = parsePageWorkflows(rawWorkflows, 'Home', variableIndex);
    expect(result).toHaveLength(1);
    expect(result[0].sourceType).toBe('page');
    expect(result[0].trigger).toBe('onload');
    expect(result[0].sourceName).toBe('Home');
    expect(result[0].id).toBe('wf1');
  });
});

describe('parseElementInteractions', () => {
  it('creates WorkflowSpec with sourceType "element"', () => {
    const variableIndex = new Map<string, string>();
    const interactions = [
      {
        id: 'int1',
        name: 'Handle Click',
        trigger: 'click',
        firstAction: 'a1',
        actions: {
          a1: { type: 'variable', name: 'Set var', next: 'a2' },
          a2: { type: 'change-page', name: 'Navigate' },
        },
        triggerConditions: null,
      },
    ];
    const result = parseElementInteractions(interactions, 'Button', variableIndex);
    expect(result).toHaveLength(1);
    expect(result[0].sourceType).toBe('element');
    expect(result[0].trigger).toBe('click');
    expect(result[0].sourceName).toBe('Button');
    expect(result[0].actions).toHaveLength(2);
  });
});

describe('parseVariables', () => {
  it('extracts persistence flags correctly', () => {
    const rawVars = [
      {
        id: 'v1',
        name: 'token',
        type: 'string',
        defaultValue: '',
        isLocalStorage: true,
        isPersistentOnNav: true,
      },
    ];
    const result = parseVariables(rawVars);
    expect(result).toHaveLength(1);
    expect(result[0].isLocalStorage).toBe(true);
    expect(result[0].isPersistentOnNav).toBe(true);
    expect(result[0].id).toBe('v1');
    expect(result[0].name).toBe('token');
    expect(result[0].type).toBe('string');
  });
});

describe('parseCollections', () => {
  it('extracts table references', () => {
    const rawColls = [
      {
        id: 'c1',
        name: 'Animals',
        mode: 'list',
        config: { table: 'animals_tbl' },
        pluginId: 'xano',
      },
    ];
    const result = parseCollections(rawColls);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('list');
    expect(result[0].table).toBe('animals_tbl');
    expect(result[0].pluginId).toBe('xano');
    expect(result[0].id).toBe('c1');
    expect(result[0].name).toBe('Animals');
  });
});
