import React, { useState } from 'react';

const Table = ({
        columns,
        data,
        loading = false,
        searchable = true,
        searchPlaceholder = "Search...",
        onRowClick,
        actions,
        striped = false,
        compact = false,
        emptyMessage = "No data found.",
        emptyIcon = null,
        headerClassName = "",
        rowClassName = "",
}) => {
        const [searchTerm, setSearchTerm] = useState('');

        // Ensure data is an array
        const safeData = Array.isArray(data) ? data : [];

        const filteredData = searchTerm.trim() === ''
                ? safeData
                : safeData.filter(item => {
                        return Object.entries(item).some(([key, val]) => {
                                if (val === null || val === undefined) return false;
                                if (typeof val === 'object') return false;
                                const strVal = String(val).toLowerCase();
                                return strVal.includes(searchTerm.toLowerCase().trim());
                        });
                });

        const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';
        const totalColumns = columns.length + (actions ? 1 : 0);

        // Skeleton loader for rows
        const SkeletonRow = ({ index }) => (
                <tr className={striped && index % 2 === 1 ? 'bg-gray-50/50' : ''}>
                        {columns.map((_, colIdx) => (
                                <td key={colIdx} className={cellPadding}>
                                        <div className="skeleton h-4 w-full max-w-[200px] rounded" />
                                </td>
                        ))}
                        {actions && (
                                <td className={`${cellPadding} text-right`}>
                                        <div className="skeleton h-8 w-20 ml-auto rounded" />
                                </td>
                        )}
                </tr>
        );

        // Empty state component
        const EmptyState = () => (
                <tr>
                        <td colSpan={totalColumns} className="px-6 py-16 text-center">
                                <div className="flex flex-col items-center gap-3">
                                        {emptyIcon || (
                                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                        </svg>
                                                </div>
                                        )}
                                        <p className="text-gray-500 text-sm font-medium">{emptyMessage}</p>
                                        {searchTerm && (
                                                <button
                                                        onClick={() => setSearchTerm('')}
                                                        className="text-primary-600 text-sm hover:underline"
                                                >
                                                        Clear search
                                                </button>
                                        )}
                                </div>
                        </td>
                </tr>
        );

        return (
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                        {searchable && (
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                        <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                </span>
                                                <input
                                                        type="text"
                                                        placeholder={searchPlaceholder}
                                                        className="w-full md:w-72 pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none text-sm bg-white"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                {searchTerm && (
                                                        <button
                                                                onClick={() => setSearchTerm('')}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                        >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                        </button>
                                                )}
                                        </div>
                                </div>
                        )}

                        <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                        <thead className={`bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider ${headerClassName}`}>
                                                <tr>
                                                        {columns.map((col, idx) => (
                                                                <th key={idx} className={`${cellPadding} whitespace-nowrap`}>
                                                                        <div className="flex items-center gap-1.5">
                                                                                {col.header}
                                                                                {col.sortable && (
                                                                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                                                        </svg>
                                                                                )}
                                                                        </div>
                                                                </th>
                                                        ))}
                                                        {actions && <th className={`${cellPadding} text-right`}>Actions</th>}
                                                </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                                {loading ? (
                                                        // Show skeleton rows while loading
                                                        Array.from({ length: 5 }).map((_, idx) => (
                                                                <SkeletonRow key={idx} index={idx} />
                                                        ))
                                                ) : filteredData?.length === 0 ? (
                                                        <EmptyState />
                                                ) : (
                                                        filteredData?.map((item, rowIdx) => (
                                                                <tr
                                                                        key={rowIdx}
                                                                        className={`
                                                                                transition-colors duration-150
                                                                                ${striped && rowIdx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}
                                                                                ${onRowClick ? 'cursor-pointer hover:bg-primary-50/50' : 'hover:bg-gray-50/80'}
                                                                                ${rowClassName}
                                                                        `}
                                                                        onClick={() => onRowClick && onRowClick(item)}
                                                                >
                                                                        {columns.map((col, colIdx) => (
                                                                                <td key={colIdx} className={`${cellPadding} text-sm text-gray-700`}>
                                                                                        {col.render ? col.render(item) : item[col.key]}
                                                                                </td>
                                                                        ))}
                                                                        {actions && (
                                                                                <td className={`${cellPadding} text-right whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
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

                        {/* Results count footer */}
                        {!loading && filteredData.length > 0 && (
                                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                                        <p className="text-xs text-gray-500">
                                                Showing <span className="font-medium text-gray-700">{filteredData.length}</span>
                                                {searchTerm && ` of ${safeData.length}`} result{filteredData.length !== 1 ? 's' : ''}
                                        </p>
                                </div>
                        )}
                </div>
        );
};

export default Table;

