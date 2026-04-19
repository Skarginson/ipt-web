import type { EvalResult, Node } from './types';
import type { Registry } from './registry';

const MAX_DEPTH = 100;

function pickRandom<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function evalNodes(
  nodes: Node[],
  registry: Registry,
  rng: () => number,
  depth: number,
  warnings: string[],
): string {
  if (depth > MAX_DEPTH) throw new Error('Max recursion depth exceeded (circular reference?)');

  return nodes.map((node) => {
    if (node.kind === 'text') return node.value;

    if (node.kind === 'ref') {
      const table = registry.get(node.tableName);
      if (!table) {
        warnings.push(`Unknown table reference: "${node.tableName}"`);
        return `[@${node.tableName}]`;
      }
      if (table.entries.length === 0) {
        warnings.push(`Table "${node.tableName}" has no entries.`);
        return '';
      }
      const entry = pickRandom(table.entries, rng);
      return evalNodes(entry, registry, rng, depth + 1, warnings);
    }

    if (node.kind === 'multiRef') {
      const table = registry.get(node.tableName);
      if (!table) {
        warnings.push(`Unknown table reference: "${node.tableName}"`);
        return `[!${node.count} ${node.tableName}]`;
      }
      if (table.entries.length === 0) {
        warnings.push(`Table "${node.tableName}" has no entries.`);
        return '';
      }

      const pool = shuffled(table.entries, rng);
      const picks = pool.slice(0, node.count);
      const evaluated = picks.map((e) => evalNodes(e, registry, rng, depth + 1, warnings));

      if (node.filter === 'implode') {
        return evaluated.join(', ');
      }
      if (node.filter !== null) {
        warnings.push(`Unknown filter "${node.filter}" — joining with spaces.`);
      }
      return evaluated.join(' ');
    }

    return '';
  }).join('');
}

export function evaluate(
  tableName: string,
  registry: Registry,
  rng: () => number = Math.random,
): EvalResult {
  const warnings: string[] = [];
  const table = registry.get(tableName);

  if (!table) {
    return {
      output: '',
      rawOutput: '',
      warnings: [`Table "${tableName}" not found.`],
    };
  }

  if (table.entries.length === 0) {
    return {
      output: '',
      rawOutput: '',
      warnings: [`Table "${tableName}" has no entries.`],
    };
  }

  let rawOutput: string;
  try {
    const entry = pickRandom(table.entries, rng);
    rawOutput = evalNodes(entry, registry, rng, 0, warnings);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { output: '', rawOutput: '', warnings: [msg] };
  }

  // Replace literal \n escape sequences with <br> for HTML output
  const output = rawOutput
    .replace(/\\n/g, '<br>')
    .replace(/\n/g, '<br>');

  const rawWithNewlines = rawOutput.replace(/\\n/g, '\n');

  return { output, rawOutput: rawWithNewlines, warnings };
}
