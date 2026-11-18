'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check, Car } from 'lucide-react';
import { DEFAULT_CAR_CATALOG } from '@/lib/car-catalog';

interface SearchableCarSelectProps {
  value: string;
  onChange: (value: string) => void;
  inventoryOptions?: string[];
  placeholder?: string;
  openDirection?: 'up' | 'down';
}

export function SearchableCarSelect({
  value,
  onChange,
  inventoryOptions = [],
  placeholder = 'Search or select car brand & model...',
  openDirection = 'up',
}: SearchableCarSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = React.useId();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 20);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredInventory = useMemo(() => {
    if (!normalizedQuery) return inventoryOptions;
    return inventoryOptions.filter((item) => item.toLowerCase().includes(normalizedQuery));
  }, [inventoryOptions, normalizedQuery]);

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return DEFAULT_CAR_CATALOG;
    return DEFAULT_CAR_CATALOG.map((group) => {
      const brandMatches = group.brand.toLowerCase().includes(normalizedQuery);
      const matchingModels = brandMatches
        ? group.models
        : group.models.filter((m) =>
            `${group.brand} ${m}`.toLowerCase().includes(normalizedQuery)
          );
      return { brand: group.brand, models: matchingModels };
    }).filter((g) => g.models.length > 0);
  }, [normalizedQuery]);

  const hasMatches = filteredInventory.length > 0 || filteredGroups.length > 0;

  const handleSelect = (carLabel: string) => {
    onChange(carLabel);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: '#FFFFFF',
          borderColor: isOpen ? '#6253F8' : undefined,
          boxShadow: isOpen ? '0 0 0 3px rgba(98, 83, 248, 0.14)' : undefined,
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: value ? '#0F172A' : '#94A3B8',
            fontWeight: value ? 600 : 400,
            fontSize: '0.88rem',
          }}
        >
          {value || placeholder}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Clear selection"
              style={{
                border: 'none',
                background: '#F1F5F9',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                padding: 0,
              }}
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: '#64748B',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
        </div>
      </div>

      {/* Searchable Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            ...(openDirection === 'up'
              ? { bottom: 'calc(100% + 6px)' }
              : { top: 'calc(100% + 6px)' }),
            zIndex: 9999,
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '14px',
            boxShadow: '0 16px 40px -8px rgba(15, 23, 42, 0.22)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Sticky Search Input */}
          <div
            style={{
              padding: '8px 10px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Search size={15} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand or model (e.g. Creta, XUV700, BMW)..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.84rem',
                color: '#0F172A',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: '2px',
                  display: 'inline-flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Scrollable Options List */}
          <div id={listboxId} role="listbox" style={{ maxHeight: '250px', overflowY: 'auto', padding: '4px 0' }}>
            {filteredInventory.length > 0 && (
              <div>
                <div
                  style={{
                    padding: '6px 12px 4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#6253F8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: '#F5F3FF',
                  }}
                >
                  Showroom Inventory Stock
                </div>
                {filteredInventory.map((car) => {
                  const selected = value === car;
                  return (
                    <button
                      key={`inv-${car}`}
                      type="button"
                      onClick={() => handleSelect(car)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 14px',
                        border: 'none',
                        backgroundColor: selected ? '#EEF2FF' : 'transparent',
                        color: selected ? '#4338CA' : '#0F172A',
                        fontSize: '0.84rem',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{car}</span>
                      {selected && <Check size={14} style={{ color: '#4338CA' }} />}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredGroups.map((group) => (
              <div key={group.brand}>
                <div
                  style={{
                    padding: '6px 12px 4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: '#F8FAFC',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  {group.brand}
                </div>
                {group.models.map((model) => {
                  const fullLabel = `${group.brand} ${model}`;
                  const selected = value === fullLabel;
                  return (
                    <button
                      key={fullLabel}
                      type="button"
                      onClick={() => handleSelect(fullLabel)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '7px 14px',
                        border: 'none',
                        backgroundColor: selected ? '#EEF2FF' : 'transparent',
                        color: selected ? '#4338CA' : '#1E293B',
                        fontSize: '0.84rem',
                        fontWeight: selected ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{fullLabel}</span>
                      {selected && <Check size={14} style={{ color: '#4338CA' }} />}
                    </button>
                  );
                })}
              </div>
            ))}

            {!hasMatches && !normalizedQuery && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                No models available
              </div>
            )}

            {normalizedQuery && (
              <div style={{ borderTop: '1px solid #E2E8F0', padding: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim())}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px dashed #A5B4FC',
                    backgroundColor: '#EEF2FF',
                    color: '#4338CA',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Car size={14} />
                  <span>Use custom model: &quot;{query.trim()}&quot;</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
