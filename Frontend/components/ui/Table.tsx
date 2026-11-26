// components/ui/Table.tsx
import React from "react";

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}

export function Table({
  headers,
  children,
  emptyMessage = "No records found.",
  isEmpty = false,
}: TableProps) {
  return (
    <div className="w-full overflow-x-auto border border-slate-300 rounded-sm bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-900 text-white">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
          {isEmpty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-12 text-center text-slate-500 uppercase font-semibold tracking-wider text-xs"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}