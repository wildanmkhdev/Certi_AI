'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Loader2, User, Shield } from 'lucide-react';
import { Input } from '@/components/ui';

interface Lecturer {
  id: string;
  full_name: string;
  lecturer_number: string;
}

interface LecturerSearchProps {
  label: string;
  placeholder?: string;
  selectedId: string | null;
  onSelect: (lecturer: Lecturer | null) => void;
  required?: boolean;
}

export function LecturerSearch({
  label,
  placeholder = 'Cari dosen...',
  selectedId,
  onSelect,
  required = false,
}: LecturerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial selected lecturer name
  useEffect(() => {
    if (selectedId) {
      fetch(`/api/lecturers/search?q=`)
        .then((res) => res.json())
        .then((data) => {
          const list = data.lecturers as Lecturer[];
          const match = list.find((l) => l.id === selectedId);
          if (match) {
            setSelectedName(match.full_name);
            setQuery(match.full_name);
          }
        })
        .catch(() => {});
    } else {
      setSelectedName('');
      setQuery('');
    }
  }, [selectedId]);

  // Handle search typing
  useEffect(() => {
    if (!isOpen || query === selectedName) return;

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/lecturers/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.lecturers || []);
      } catch (err) {
        console.error('Failed to search lecturers:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, isOpen, selectedName]);

  const handleSelect = (lecturer: Lecturer) => {
    onSelect(lecturer);
    setSelectedName(lecturer.full_name);
    setQuery(lecturer.full_name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSelectedName('');
    setQuery('');
    setIsOpen(true);
  };

  return (
    <div ref={dropdownRef} className="relative space-y-1.5 w-full">
      <Input
        type="text"
        label={label}
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        icon={<Search className="w-5 h-5" />}
        required={required && !selectedId}
        className="pr-10"
      />

      {selectedId && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-[38px] text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-0.5 rounded-md cursor-pointer"
        >
          Hapus
        </button>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-4 text-gray-500 text-sm gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[rgb(34_72_19)]" />
              Mencari dosen...
            </div>
          ) : results.length === 0 ? (
            <div className="py-3 px-4 text-gray-500 text-sm text-center">
              Dosen tidak ditemukan
            </div>
          ) : (
            results.map((lecturer) => (
              <button
                key={lecturer.id}
                type="button"
                onClick={() => handleSelect(lecturer)}
                className="w-full text-left px-4 py-3 hover:bg-[rgb(241_246_249)] transition-colors flex items-start gap-3 cursor-pointer"
              >
                <User className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {lecturer.full_name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Shield className="w-3.5 h-3.5" />
                    NIDN: {lecturer.lecturer_number}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
