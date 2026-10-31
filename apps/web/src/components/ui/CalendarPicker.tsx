'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface CalendarPickerProps {
  selectedDate: string; // Format: YYYY-MM-DD
  selectedMonth: string; // 'all' | 'Jan' | 'Feb' ...
  selectedYear: string; // '2026'
  onSelectDate: (dateStr: string, yearStr: string, monthStr: string) => void;
  onSelectAllMonths?: (yearStr: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const YEARS = ['2027', '2026', '2025', '2024', '2023'];

export function CalendarPicker({
  selectedDate,
  selectedMonth,
  selectedYear,
  onSelectDate,
  onSelectAllMonths,
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // View state for browsing the calendar (month: 0-11, year: number)
  const [viewYear, setViewYear] = useState(() => {
    if (selectedDate) {
      const y = parseInt(selectedDate.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return parseInt(selectedYear, 10) || 2026;
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) {
      const m = parseInt(selectedDate.split('-')[1], 10);
      if (!isNaN(m)) return m - 1;
    }
    if (selectedMonth !== 'all') {
      const idx = MONTH_SHORT.indexOf(selectedMonth);
      if (idx !== -1) return idx;
    }
    return new Date().getMonth();
  });

  // Sync view when selectedDate or selectedYear changes
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y)) setViewYear(y);
        if (!isNaN(m) && m >= 0 && m < 12) setViewMonth(m);
      }
    }
  }, [selectedDate]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Format label for trigger button
  const getTriggerLabel = () => {
    if (selectedMonth === 'all') {
      return `All Months · ${selectedYear}`;
    }
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-');
      const mIdx = parseInt(m, 10) - 1;
      const monthName = MONTH_SHORT[mIdx] || m;
      const dayNum = parseInt(d, 10);

      // Check if today
      const today = new Date();
      const isToday =
        today.getFullYear() === parseInt(y, 10) &&
        today.getMonth() === mIdx &&
        today.getDate() === dayNum;

      if (isToday) {
        return `Today · ${dayNum} ${monthName}, ${y}`;
      }
      return `${dayNum} ${monthName}, ${y}`;
    }
    return 'Select Date';
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const yStr = String(viewYear);
    const dateStr = `${yStr}-${mm}-${dd}`;
    const mStr = MONTH_SHORT[viewMonth];

    onSelectDate(dateStr, yStr, mStr);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    const yStr = String(y);
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${yStr}-${mm}-${dd}`;
    const mStr = MONTH_SHORT[m];

    setViewYear(y);
    setViewMonth(m);
    onSelectDate(dateStr, yStr, mStr);
    setIsOpen(false);
  };

  const handleAllMonths = () => {
    if (onSelectAllMonths) {
      onSelectAllMonths(String(viewYear));
    }
    setIsOpen(false);
  };

  // Build calendar matrix (Monday as first day)
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  // In JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  const startOffset = (firstDay + 6) % 7; // Monday = 0, Sunday = 6
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays: number[] = [];
  for (let i = startOffset - 1; i >= 0; i--) {
    prevMonthDays.push(daysInPrevMonth - i);
  }

  const currentMonthDays: number[] = [];
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    currentMonthDays.push(d);
  }

  const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = totalCellsSoFar <= 35 ? 35 - totalCellsSoFar : 42 - totalCellsSoFar;
  const nextMonthDays: number[] = [];
  for (let d = 1; d <= remainingCells; d++) {
    nextMonthDays.push(d);
  }

  // Check selected date matching
  let selectedDayNum: number | null = null;
  if (selectedDate && selectedMonth !== 'all') {
    const [selY, selM, selD] = selectedDate.split('-');
    if (parseInt(selY, 10) === viewYear && parseInt(selM, 10) - 1 === viewMonth) {
      selectedDayNum = parseInt(selD, 10);
    }
  }

  const today = new Date();
  const isCurrentViewTodayMonth =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth;
  const todayDateNum = today.getDate();

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '999px',
          border: isOpen ? '1.5px solid #6253F8' : '1px solid var(--line)',
          background: 'var(--float)',
          color: 'var(--text)',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(98, 83, 248, 0.16)'
            : '0 2px 6px rgba(0, 0, 0, 0.02)',
          transition: 'all 0.18s ease',
        }}
        title="Open Date Filter"
      >
        <CalendarIcon size={14} style={{ color: '#6253F8', flexShrink: 0 }} />
        <span>{getTriggerLabel()}</span>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            zIndex: 1000,
            width: '320px',
            padding: '20px',
            borderRadius: '24px',
            background: 'var(--surface, #FFFFFF)',
            border: '1px solid rgba(98, 83, 248, 0.16)',
            boxShadow:
              '0 24px 60px -15px rgba(98, 83, 248, 0.28), 0 8px 24px -6px rgba(0, 0, 0, 0.08)',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Controls (Month, Year & Nav arrows) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            {/* Prev Month */}
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid rgba(98, 83, 248, 0.12)',
                background: 'var(--float, #FAFBF9)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Month & Year Selectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Month Dropdown */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: '2px 4px',
                  borderRadius: '6px',
                }}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Year Dropdown */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  color: '#6253F8',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: '2px 4px',
                  borderRadius: '6px',
                }}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Month */}
            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid rgba(98, 83, 248, 0.12)',
                background: 'var(--float, #FAFBF9)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels (Mo - Su) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginBottom: '8px',
            }}
          >
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                style={{
                  textAlign: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  padding: '2px 0',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginBottom: '14px',
            }}
          >
            {/* Previous Month Padded Days */}
            {prevMonthDays.map((d) => (
              <div
                key={`prev-${d}`}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  opacity: 0.3,
                  userSelect: 'none',
                }}
              >
                {d}
              </div>
            ))}

            {/* Current Month Days */}
            {currentMonthDays.map((day) => {
              const isSelected = selectedDayNum === day;
              const isToday = isCurrentViewTodayMonth && todayDateNum === day;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '12px',
                    border: isToday && !isSelected ? '1.5px solid #6253F8' : 'none',
                    background: isSelected
                      ? 'linear-gradient(135deg, #7957F6 0%, #6253F8 50%, #4054F5 100%)'
                      : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--text)',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 800 : isToday ? 700 : 600,
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? '0 4px 14px rgba(98, 83, 248, 0.42)'
                      : 'none',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(98, 83, 248, 0.08)';
                      e.currentTarget.style.color = '#6253F8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text)';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}

            {/* Next Month Padded Days */}
            {nextMonthDays.map((d) => (
              <div
                key={`next-${d}`}
                style={{
                  aspectRatio: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  opacity: 0.3,
                  userSelect: 'none',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Quick Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(98, 83, 248, 0.1)',
              paddingTop: '12px',
            }}
          >
            <button
              type="button"
              onClick={handleAllMonths}
              style={{
                background: selectedMonth === 'all' ? 'rgba(98, 83, 248, 0.12)' : 'transparent',
                color: selectedMonth === 'all' ? '#6253F8' : 'var(--muted)',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '8px',
                transition: 'all 0.15s ease',
              }}
            >
              All Months ({viewYear})
            </button>

            <button
              type="button"
              onClick={handleSelectToday}
              style={{
                background: 'linear-gradient(135deg, #7957F6 0%, #6253F8 50%, #4054F5 100%)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '6px 14px',
                borderRadius: '999px',
                boxShadow: '0 3px 10px rgba(98, 83, 248, 0.32)',
                transition: 'all 0.15s ease',
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
