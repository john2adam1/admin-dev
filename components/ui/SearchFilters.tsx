'use client';

import { useState, useCallback } from 'react';
import { Button } from './Button';

export interface FilterConfig {
    key: string;
    label: string;
    type: 'text' | 'select' | 'boolean' | 'date';
    options?: { value: string | number | boolean; label: string }[];
    placeholder?: string;
}

interface SearchFiltersProps {
    configs: FilterConfig[];
    onFilter: (filters: Record<string, any>) => void;
    className?: string;
}

export function SearchFilters({ configs, onFilter, className = "" }: SearchFiltersProps) {
    const [filters, setFilters] = useState<Record<string, any>>({});

    const handleChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        // Remove empty values
        if (value === '' || value === undefined || value === null) {
            delete newFilters[key];
        }
        setFilters(newFilters);
    };

    const handleSearch = () => {
        onFilter(filters);
    };

    const handleReset = () => {
        setFilters({});
        onFilter({});
    };

    return (
        <div className={`flex flex-wrap gap-4 mb-6 items-end ${className}`}>
            {configs.map((config) => (
                <div key={config.key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">{config.label}</label>
                    {config.type === 'text' && (
                        <input
                            type="text"
                            placeholder={config.placeholder}
                            value={filters[config.key] || ''}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                        />
                    )}
                    {config.type === 'select' && (
                        <select
                            value={filters[config.key] || ''}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                        >
                            <option value="">Barchasi</option>
                            {config.options?.map((opt) => (
                                <option key={String(opt.value)} value={String(opt.value)}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}
                    {config.type === 'boolean' && (
                        <select
                            value={filters[config.key] === undefined ? '' : String(filters[config.key])}
                            onChange={(e) => {
                                const val = e.target.value === '' ? undefined : e.target.value === 'true';
                                handleChange(config.key, val);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px]"
                        >
                            <option value="">Barchasi</option>
                            <option value="true">Ha</option>
                            <option value="false">Yo'q</option>
                        </select>
                    )}
                    {config.type === 'date' && (
                        <input
                            type="date"
                            value={filters[config.key] || ''}
                            onChange={(e) => handleChange(config.key, e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                        />
                    )}
                </div>
            ))}
            <div className="flex gap-2">
                <Button onClick={handleSearch} variant="default">
                    Qidirish
                </Button>
                <Button onClick={handleReset} variant="outline">
                    Tozalash
                </Button>
            </div>
        </div>
    );
}
