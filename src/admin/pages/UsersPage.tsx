import React, { useEffect, useState } from 'react';
import { Search, AlertCircle, Loader2, UserCheck, UserX, RefreshCw } from 'lucide-react';
import { adminFetch } from '../adminApi';
import type { UserRecord } from '../types';

// Read users directly from IndexedDB without going through userDb class
function readUsersFromIndexedDB(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NaturalQuerySystemDB', 1);
    request.onerror = () => reject(new Error('Could not open IndexedDB'));
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('users')) {
        db.close();
        resolve([]);
        return;
      }
      const tx = db.transaction(['users'], 'readonly');
      const store = tx.objectStore('users');
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => { db.close(); resolve(getAllReq.result ?? []); };
      getAllReq.onerror = () => { db.close(); reject(getAllReq.error); };
    };
  });
}

// Write isActive flag back to IndexedDB
function updateUserActiveInIndexedDB(email: string, isActive: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NaturalQuerySystemDB', 1);
    request.onerror = () => reject(new Error('Could not open IndexedDB'));
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['users'], 'readwrite');
      const store = tx.objectStore('users');
      const index = store.index('email');
      const getReq = index.get(email.toLowerCase());
      getReq.onsuccess = () => {
        const user = getReq.result;
        if (user) {
          user.isActive = isActive;
          store.put(user);
        }
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
      getReq.onerror = () => { db.close(); reject(getReq.error); };
    };
  });
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
      Inactive
    </span>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      // Open IndexedDB directly — same DB the main app uses
      const idbUsers = await readUsersFromIndexedDB();
      const mapped: UserRecord[] = idbUsers.map((u, idx) => ({
        id: u.id ?? idx + 1,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin,
        isActive: u.isActive !== false,
      }));
      setUsers(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();

    // Refresh when the tab becomes visible again (e.g. user switches back from main app)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadUsers();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  async function handleToggleStatus(user: UserRecord) {
    const action = user.isActive ? 'deactivate' : 'reactivate';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.name} (${user.email})?`
    );
    if (!confirmed) return;

    setTogglingId(user.id);
    try {
      const newStatus = !user.isActive;

      // Update IndexedDB directly
      await updateUserActiveInIndexedDB(user.email, newStatus);

      // Update server mirror (best-effort)
      adminFetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: newStatus }),
      }).catch(() => {});

      // Update local state immediately
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {loading ? 'Loading…' : `${users.length} total user${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={loadUsers}
            disabled={loading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh users"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Search */}
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-3 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Registered</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Last Login</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((user) => (
                <tr key={user.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{user.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(user.lastLogin)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge isActive={user.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      disabled={togglingId === user.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                        ${user.isActive
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40'
                        }`}
                    >
                      {togglingId === user.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : user.isActive ? (
                        <UserX size={13} />
                      ) : (
                        <UserCheck size={13} />
                      )}
                      {user.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
