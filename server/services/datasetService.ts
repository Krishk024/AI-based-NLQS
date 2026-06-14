import { v4 as uuidv4 } from 'uuid';
import db from '../db/sqlite.js';
import type { DatasetMeta, DatasetSchema } from '../types.js';

type ColumnType = 'string' | 'number' | 'boolean' | 'date';

// ISO 8601 date pattern (basic check)
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;

function inferType(value: string): ColumnType {
  if (value === 'true' || value === 'false') return 'boolean';
  if (value !== '' && !isNaN(Number(value))) return 'number';
  if (ISO_DATE_RE.test(value)) return 'date';
  return 'string';
}

function inferColumnTypes(
  headers: string[],
  rows: Record<string, string>[]
): Array<{ name: string; type: ColumnType }> {
  return headers.map((header) => {
    // Use first non-empty value to infer type
    const sample = rows.find((r) => r[header] !== undefined && r[header] !== '');
    const type = sample ? inferType(String(sample[header])) : 'string';
    return { name: header, type };
  });
}

function parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) throw Object.assign(new Error('Empty CSV file'), { status: 400 });

  const headers = lines[0].split(',').map((h) => h.trim());
  if (headers.length === 0) throw Object.assign(new Error('No columns found in CSV'), { status: 400 });

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }
  return { headers, rows };
}

function parseJson(content: string): { headers: string[]; rows: Record<string, string>[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw Object.assign(new Error('Invalid JSON content'), { status: 400 });
  }

  if (!Array.isArray(parsed)) {
    throw Object.assign(new Error('JSON must be an array of objects'), { status: 400 });
  }

  if (parsed.length === 0) {
    return { headers: [], rows: [] };
  }

  const first = parsed[0];
  if (typeof first !== 'object' || first === null || Array.isArray(first)) {
    throw Object.assign(new Error('JSON array must contain objects'), { status: 400 });
  }

  const headers = Object.keys(first as Record<string, unknown>);
  const rows = (parsed as Record<string, unknown>[]).map((item) => {
    const row: Record<string, string> = {};
    headers.forEach((h) => {
      const val = (item as Record<string, unknown>)[h];
      row[h] = val === null || val === undefined ? '' : String(val);
    });
    return row;
  });

  return { headers, rows };
}

export function parseAndStore(file: Express.Multer.File): DatasetMeta {
  // Size check (multer already enforces 10 MB, but guard here too)
  if (file.size > 10 * 1024 * 1024) {
    throw Object.assign(new Error('File too large. Maximum size is 10 MB.'), { status: 413 });
  }

  const content = file.buffer.toString('utf-8');
  const originalName = file.originalname;
  const ext = originalName.split('.').pop()?.toLowerCase();

  let headers: string[];
  let rows: Record<string, string>[];
  let format: 'csv' | 'json';

  if (ext === 'csv' || file.mimetype === 'text/csv') {
    format = 'csv';
    ({ headers, rows } = parseCsv(content));
  } else if (ext === 'json' || file.mimetype === 'application/json') {
    format = 'json';
    ({ headers, rows } = parseJson(content));
  } else {
    // Try to detect by content
    const trimmed = content.trimStart();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      format = 'json';
      ({ headers, rows } = parseJson(content));
    } else {
      format = 'csv';
      try {
        ({ headers, rows } = parseCsv(content));
      } catch {
        throw Object.assign(
          new Error('Invalid file format. Only CSV and JSON are accepted.'),
          { status: 400 }
        );
      }
    }
  }

  const columns = inferColumnTypes(headers, rows);
  const id = uuidv4();
  const uploadedAt = Date.now();

  const insertDataset = db.prepare(
    'INSERT INTO datasets (id, name, format, row_count, col_count, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertColumn = db.prepare(
    'INSERT INTO dataset_columns (dataset_id, col_name, col_type) VALUES (?, ?, ?)'
  );
  const insertRow = db.prepare(
    'INSERT INTO dataset_rows (dataset_id, row_data) VALUES (?, ?)'
  );

  const transaction = db.transaction(() => {
    insertDataset.run(id, originalName, format, rows.length, columns.length, uploadedAt);
    for (const col of columns) {
      insertColumn.run(id, col.name, col.type);
    }
    for (const row of rows) {
      insertRow.run(id, JSON.stringify(row));
    }
  });

  transaction();

  return {
    id,
    name: originalName,
    format,
    rowCount: rows.length,
    columnCount: columns.length,
    uploadedAt,
  };
}

export function getAll(): DatasetMeta[] {
  const rows = db
    .prepare('SELECT id, name, format, row_count, col_count, uploaded_at FROM datasets ORDER BY uploaded_at DESC')
    .all() as Array<{
      id: string;
      name: string;
      format: 'csv' | 'json';
      row_count: number;
      col_count: number;
      uploaded_at: number;
    }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    format: r.format,
    rowCount: r.row_count,
    columnCount: r.col_count,
    uploadedAt: r.uploaded_at,
  }));
}

export function getById(id: string): { meta: DatasetMeta; schema: DatasetSchema } | null {
  const row = db
    .prepare('SELECT id, name, format, row_count, col_count, uploaded_at FROM datasets WHERE id = ?')
    .get(id) as
    | { id: string; name: string; format: 'csv' | 'json'; row_count: number; col_count: number; uploaded_at: number }
    | undefined;

  if (!row) return null;

  const cols = db
    .prepare('SELECT col_name, col_type FROM dataset_columns WHERE dataset_id = ?')
    .all(id) as Array<{ col_name: string; col_type: ColumnType }>;

  const meta: DatasetMeta = {
    id: row.id,
    name: row.name,
    format: row.format,
    rowCount: row.row_count,
    columnCount: row.col_count,
    uploadedAt: row.uploaded_at,
  };

  const schema: DatasetSchema = {
    datasetId: id,
    columns: cols.map((c) => ({ name: c.col_name, type: c.col_type })),
  };

  return { meta, schema };
}

export function deleteById(id: string): boolean {
  const result = db.prepare('DELETE FROM datasets WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getRows(id: string, limit = 500): Record<string, unknown>[] {
  const rows = db
    .prepare('SELECT row_data FROM dataset_rows WHERE dataset_id = ? LIMIT ?')
    .all(id, limit) as Array<{ row_data: string }>;
  return rows.map(r => {
    try { return JSON.parse(r.row_data); } catch { return {}; }
  });
}
