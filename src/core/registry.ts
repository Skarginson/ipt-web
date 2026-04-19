import type { Table } from './types';

export class Registry {
  private map = new Map<string, Table>();

  add(tables: Table[]): void {
    for (const table of tables) {
      if (this.map.has(table.name)) {
        console.warn(`[Registry] Duplicate table "${table.name}" — last loaded wins.`);
      }
      this.map.set(table.name, table);
    }
  }

  get(name: string): Table | undefined {
    return this.map.get(name);
  }

  listNames(): string[] {
    return Array.from(this.map.keys());
  }

  clear(): void {
    this.map.clear();
  }
}
