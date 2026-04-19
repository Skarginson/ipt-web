export type Node =
  | { kind: 'text'; value: string }
  | { kind: 'ref'; tableName: string }
  | { kind: 'multiRef'; count: number; tableName: string; filter: string | null };

export type Entry = Node[];

export type Table = {
  name: string;
  entries: Entry[];
};

export type ParseWarning = {
  line: number;
  message: string;
};

export type ParseResult = {
  tables: Table[];
  warnings: ParseWarning[];
};

export type EvalResult = {
  output: string;
  rawOutput: string;
  warnings: string[];
};
