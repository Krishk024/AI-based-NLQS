import type { DatasetSchema } from '../types';

interface DatasetSchemaTableProps {
  schema: DatasetSchema;
}

const typeColors: Record<string, string> = {
  string: 'text-blue-600 dark:text-blue-400',
  number: 'text-green-600 dark:text-green-400',
  boolean: 'text-purple-600 dark:text-purple-400',
  date: 'text-orange-600 dark:text-orange-400',
};

export function DatasetSchemaTable({ schema }: DatasetSchemaTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
              Column Name
            </th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">
              Type
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {schema.columns.map((col) => (
            <tr
              key={col.name}
              className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <td className="px-4 py-2.5 font-mono text-gray-800 dark:text-gray-200">{col.name}</td>
              <td className={`px-4 py-2.5 font-mono font-medium ${typeColors[col.type] ?? 'text-gray-600 dark:text-gray-400'}`}>
                {col.type}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
