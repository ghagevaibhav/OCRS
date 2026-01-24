import React, { useState } from 'react';

const Table = ({
        columns,
        data,
        loading = false,
        searchable = true,
        searchPlaceholder = "Search...",
        onRowClick,
        actions
}) => {
        const [searchTerm, setSearchTerm] = useState('');

        const filteredData = searchTerm.trim() === ''
                ? data
                : data?.filter(item => {
                        // Search through all string/number values of the object
                        return Object.entries(item).some(([key, val]) => {
                                // Skip null/undefined values and non-searchable fields
                                if (val === null || val === undefined) return false;
                                // Skip nested objects and arrays (like relationships)
                                if (typeof val === 'object') return false;
                                // Convert to string and search
                                const strVal = String(val).toLowerCase();
                                return strVal.includes(searchTerm.toLowerCase().trim());
                        });
                });

        return (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {searchable && (
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                                                <input
                                                        type="text"
                                                        placeholder={searchPlaceholder}
                                                        className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all outline-none text-sm"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                        </div>
                                </div>
                        )}

                        <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                                                <tr>
                                                        {columns.map((col, idx) => (
                                                                <th key={idx} className="px-6 py-4">{col.header}</th>
                                                        ))}
                                                        {actions && <th className="px-6 py-4 text-right">Actions</th>}
                                                </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                                {loading ? (
                                                        <tr>
                                                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                                                        Loading data...
                                                                </td>
                                                        </tr>
                                                ) : filteredData?.length === 0 ? (
                                                        <tr>
                                                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-400 text-sm">
                                                                        No data found.
                                                                </td>
                                                        </tr>
                                                ) : (
                                                        filteredData?.map((item, rowIdx) => (
                                                                <tr
                                                                        key={rowIdx}
                                                                        className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                                                        onClick={() => onRowClick && onRowClick(item)}
                                                                >
                                                                        {columns.map((col, colIdx) => (
                                                                                <td key={colIdx} className="px-6 py-4 text-sm text-slate-600">
                                                                                        {col.render ? col.render(item) : item[col.key]}
                                                                                </td>
                                                                        ))}
                                                                        {actions && (
                                                                                <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                                                        <div className="flex items-center justify-end gap-2">
                                                                                                {actions(item)}
                                                                                        </div>
                                                                                </td>
                                                                        )}
                                                                </tr>
                                                        ))
                                                )}
                                        </tbody>
                                </table>
                        </div>
                </div>
        );
};

export default Table;
