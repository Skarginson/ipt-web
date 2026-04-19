import type { Entry, Node, ParseResult, ParseWarning, Table } from './types';

const TABLE_DECL = /^Table:\s*(\S+)\s*$/;

function decodeHtmlEntityName(name: string): string {
  const hexMatch = name.match(/^&#x([0-9a-fA-F]+);?$/);
  if (hexMatch) return String.fromCodePoint(parseInt(hexMatch[1], 16));
  const decMatch = name.match(/^&#(\d+);?$/);
  if (decMatch) return String.fromCodePoint(parseInt(decMatch[1], 10));
  return name;
}

function parseEntry(raw: string, lineNum: number, warnings: ParseWarning[]): Entry {
  const nodes: Node[] = [];
  let pos = 0;
  const text = raw;

  while (pos < text.length) {
    const bracketIdx = text.indexOf('[', pos);
    if (bracketIdx === -1) {
      nodes.push({ kind: 'text', value: text.slice(pos) });
      break;
    }

    if (bracketIdx > pos) {
      nodes.push({ kind: 'text', value: text.slice(pos, bracketIdx) });
    }

    const closeIdx = text.indexOf(']', bracketIdx);
    if (closeIdx === -1) {
      nodes.push({ kind: 'text', value: text.slice(bracketIdx) });
      break;
    }

    const inner = text.slice(bracketIdx + 1, closeIdx);

    // [@TableName]
    if (inner.startsWith('@')) {
      const tableName = decodeHtmlEntityName(inner.slice(1));
      nodes.push({ kind: 'ref', tableName });
      pos = closeIdx + 1;
      continue;
    }

    // [!N TableName >> filter] — tolerates any whitespace around >>
    const multiMatch = inner.match(/^!(\d+)\s+(\S+?)\s*>>\s*(\S+)$/);
    if (multiMatch) {
      const count = parseInt(multiMatch[1], 10);
      const tableName = decodeHtmlEntityName(multiMatch[2]);
      const filter = multiMatch[3];
      nodes.push({ kind: 'multiRef', count, tableName, filter });
      pos = closeIdx + 1;
      continue;
    }

    // [!N TableName] without filter
    const multiNoFilter = inner.match(/^!(\d+)\s+(\S+)$/);
    if (multiNoFilter) {
      const count = parseInt(multiNoFilter[1], 10);
      const tableName = decodeHtmlEntityName(multiNoFilter[2]);
      nodes.push({ kind: 'multiRef', count, tableName, filter: null });
      pos = closeIdx + 1;
      continue;
    }

    // [&#xNNNN] or [&#NNNN] — entity as table reference
    const entityRef = inner.match(/^(&#x[0-9a-fA-F]+;?|&#\d+;?)$/);
    if (entityRef) {
      const tableName = decodeHtmlEntityName(inner);
      nodes.push({ kind: 'ref', tableName });
      pos = closeIdx + 1;
      continue;
    }

    // Unknown pattern — pass through as literal text
    warnings.push({ line: lineNum, message: `Unknown reference: [${inner}]` });
    nodes.push({ kind: 'text', value: `[${inner}]` });
    pos = closeIdx + 1;
  }

  return nodes;
}

export function parse(source: string): ParseResult {
  // Strip BOM
  const clean = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n');

  const tables: Table[] = [];
  const warnings: ParseWarning[] = [];
  let currentTable: Table | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    const declMatch = line.match(TABLE_DECL);
    if (declMatch) {
      const rawName = declMatch[1];
      const name = decodeHtmlEntityName(rawName);
      currentTable = { name, entries: [] };
      tables.push(currentTable);
      continue;
    }

    if (!currentTable) continue;

    const trimmed = line.trimEnd();
    if (trimmed.trim() === '') continue;

    const entry = parseEntry(trimmed, lineNum, warnings);
    currentTable.entries.push(entry);
  }

  return { tables, warnings };
}
