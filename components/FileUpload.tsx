import React, { useEffect, useState } from 'react';

interface SharedDataset {
  id: string;
  name: string;
  format: string;
  rowCount: number;
  columnCount: number;
}

interface FileUploadProps {
  onUploadComplete: (fileNames: string[]) => void;
  onSharedDatasetSelect?: (context: string, label: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete, onSharedDatasetSelect }) => {
  const [tab, setTab] = useState<'upload' | 'shared'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Shared datasets state
  const [sharedDatasets, setSharedDatasets] = useState<SharedDataset[]>([]);
  const [sharedLoading, setSharedLoading] = useState(false);
  const [sharedError, setSharedError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (tab === 'shared') {
      setSharedLoading(true);
      setSharedError(null);
      fetch('/api/public/datasets')
        .then((r) => r.json())
        .then((data) => setSharedDatasets(Array.isArray(data) ? data : []))
        .catch(() => setSharedError('Could not load shared datasets. Make sure the server is running.'))
        .finally(() => setSharedLoading(false));
    }
  }, [tab]);

  const handleUseSharedDataset = async () => {
    if (!selectedId || !onSharedDatasetSelect) return;
    try {
      const res = await fetch(`/api/public/datasets/${selectedId}`);
      const data = await res.json();
      const schema = data.schema?.columns ?? [];
      const meta = sharedDatasets.find((d) => d.id === selectedId);
      const context = `Dataset name: ${meta?.name ?? selectedId}. Schema: ${JSON.stringify(schema)}.`;
      onSharedDatasetSelect(context, meta?.name ?? selectedId);
    } catch {
      setSharedError('Failed to load dataset schema.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const newFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !existing.has(f.name))];
    });
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...newFiles.filter((f) => !existing.has(f.name))];
    });
  };
  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));
  const handleUpload = () => {
    if (!files.length) return;
    setIsUploading(true);
    setTimeout(() => { setIsUploading(false); onUploadComplete(files.map((f) => f.name)); }, 2500);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (ext === 'json') return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
    return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-12 animate-fade-in">
      {/* Tab switcher */}
      <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 mb-6 shadow-sm">
        <button
          onClick={() => setTab('upload')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'upload' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Upload My Files
        </button>
        <button
          onClick={() => setTab('shared')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'shared' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Use Shared Dataset
        </button>
      </div>

      {/* Upload tab */}
      {tab === 'upload' && (
        files.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Staged Datasets</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{files.length} file(s) selected</p>
              </div>
              <label className="cursor-pointer text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                + Add more
                <input type="file" className="hidden" multiple accept=".csv,.json,.xlsx,.xls,.sql" onChange={handleFileSelect} />
              </label>
            </div>
            <div className="space-y-3 mb-8 max-h-64 overflow-y-auto">
              {files.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${getFileIcon(file.name)}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop()}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-6">
              <button onClick={() => setFiles([])} className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Clear All</button>
              <button onClick={handleUpload} disabled={isUploading} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-70 flex items-center gap-2">
                {isUploading ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analyzing...</> : 'Process for Analysis'}
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`py-16 text-center transition-all duration-300 ${isDragging ? 'scale-[1.02]' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${isDragging ? 'bg-blue-100 dark:bg-blue-900/40 scale-110' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Upload your Datasets</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">Drag and drop CSV, JSON, or Excel files here.</p>
            <label className="inline-flex cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all hover:scale-105">
              Browse Files
              <input type="file" className="hidden" multiple accept=".csv,.json,.xlsx,.xls,.sql" onChange={handleFileSelect} />
            </label>
          </div>
        )
      )}

      {/* Shared datasets tab */}
      {tab === 'shared' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-xl">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Shared Datasets</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Datasets uploaded by the admin, available for everyone to query.</p>

          {sharedLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse" />)}
            </div>
          )}

          {sharedError && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{sharedError}</div>
          )}

          {!sharedLoading && !sharedError && sharedDatasets.length === 0 && (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
              No shared datasets yet. Ask your admin to upload some.
            </div>
          )}

          {!sharedLoading && sharedDatasets.length > 0 && (
            <div className="space-y-3 mb-6">
              {sharedDatasets.map((ds) => (
                <label
                  key={ds.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedId === ds.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'}`}
                >
                  <input type="radio" name="shared-dataset" value={ds.id} checked={selectedId === ds.id} onChange={() => setSelectedId(ds.id)} className="accent-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{ds.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{ds.format} • {ds.rowCount.toLocaleString()} rows • {ds.columnCount} columns</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${ds.format === 'csv' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'}`}>{ds.format}</span>
                </label>
              ))}
            </div>
          )}

          {!sharedLoading && sharedDatasets.length > 0 && (
            <button
              onClick={handleUseSharedDataset}
              disabled={!selectedId}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg transition-all"
            >
              Use Selected Dataset
            </button>
          )}
        </div>
      )}
    </div>
  );
};
