import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, ChevronRight, X, AlertCircle, Loader2 } from 'lucide-react';
import { adminFetch, ADMIN_TOKEN_KEY } from '../adminApi';
import { DatasetSchemaTable } from '../components/DatasetSchemaTable';
import type { DatasetMeta, DatasetSchema } from '../types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const formatBadgeColors: Record<string, string> = {
  csv: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  json: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetMeta[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const [selectedDataset, setSelectedDataset] = useState<DatasetMeta | null>(null);
  const [schema, setSchema] = useState<DatasetSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadDatasets() {
    setListLoading(true);
    setListError(null);
    try {
      const data = await adminFetch<DatasetMeta[]>('/api/datasets');
      setDatasets(data);
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    loadDatasets();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    // Client-side size check
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Client-side type check
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'json') {
      setUploadError('Only .csv and .json files are accepted.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem(ADMIN_TOKEN_KEY);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        let message = response.statusText;
        try {
          const body = await response.json();
          if (body?.message) message = body.message;
          else if (body?.error) message = body.error;
        } catch { /* ignore */ }
        throw new Error(message);
      }

      setUploadSuccess(`"${file.name}" uploaded successfully.`);
      await loadDatasets();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRowClick(dataset: DatasetMeta) {
    setSelectedDataset(dataset);
    setSchema(null);
    setSchemaError(null);
    setSchemaLoading(true);
    try {
      const data = await adminFetch<{ meta: DatasetMeta; schema: DatasetSchema }>(`/api/datasets/${dataset.id}`);
      setSchema(data.schema);
    } catch (err: unknown) {
      setSchemaError(err instanceof Error ? err.message : 'Failed to load schema');
    } finally {
      setSchemaLoading(false);
    }
  }

  async function handleDelete(dataset: DatasetMeta, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(`Delete dataset "${dataset.name}"? This cannot be undone.`)) return;
    try {
      await adminFetch(`/api/datasets/${dataset.id}`, { method: 'DELETE' });
      if (selectedDataset?.id === dataset.id) {
        setSelectedDataset(null);
        setSchema(null);
      }
      await loadDatasets();
    } catch (err: unknown) {
      setListError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Datasets</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload and manage CSV and JSON datasets
        </p>
      </div>

      {/* Upload area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload Dataset</h2>

        <div className="flex items-center gap-3">
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors
              ${uploading
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? 'Uploading…' : 'Choose File'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              disabled={uploading}
              onChange={handleFileChange}
            />
          </label>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            .csv or .json · max 10 MB
          </span>
        </div>

        {uploadError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 px-3 py-2 text-green-700 dark:text-green-300 text-sm">
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>

      {/* Main content: list + side panel */}
      <div className="flex gap-4">
        {/* Dataset list */}
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {listError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {listError}
            </div>
          )}

          {listLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <div className="p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              No datasets uploaded yet.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Format</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Rows</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Columns</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Uploaded</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {datasets.map((ds) => (
                  <tr
                    key={ds.id}
                    onClick={() => handleRowClick(ds)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${selectedDataset?.id === ds.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                      <span className="flex items-center gap-1">
                        {ds.name}
                        {selectedDataset?.id === ds.id && (
                          <ChevronRight size={14} className="text-indigo-500 shrink-0" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${formatBadgeColors[ds.format] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ds.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                      {ds.rowCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300 tabular-nums">
                      {ds.columnCount}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(ds.uploadedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => handleDelete(ds, e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Schema side panel */}
        {selectedDataset && (
          <div className="w-80 shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">Schema</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedDataset.name}</p>
              </div>
              <button
                onClick={() => { setSelectedDataset(null); setSchema(null); }}
                className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {schemaLoading && (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              )}
              {schemaError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {schemaError}
                </div>
              )}
              {schema && <DatasetSchemaTable schema={schema} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
