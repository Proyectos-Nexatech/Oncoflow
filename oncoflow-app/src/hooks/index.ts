// Hooks personalizados de ONCOFLOW
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Usuario } from '@/types';

// ============================================================
// useDebounce — Debounce para búsquedas
// ============================================================
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================
// useCurrentUser — Usuario autenticado actual
// ============================================================
export function useCurrentUser() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data } = await supabase
            .from('usuarios')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();
          setUser(data);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  return { user, loading };
}

// ============================================================
// useLocalStorage — Estado persistente en localStorage
// ============================================================
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// ============================================================
// useSidebarState — Estado del sidebar (colapsado/expandido)
// ============================================================
export function useSidebarState() {
  const [collapsed, setCollapsed] = useLocalStorage('sidebar-collapsed', false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => setCollapsed((c: boolean) => !c), [setCollapsed]);
  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return { collapsed, toggle, mobileOpen, toggleMobile, closeMobile };
}

// ============================================================
// usePagination — Paginación de tablas
// ============================================================
export function usePagination<T>(items: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    total: items.length,
    from: startIndex + 1,
    to: Math.min(startIndex + itemsPerPage, items.length),
  };
}

// ============================================================
// useFilter — Filtrado de listas
// ============================================================
export function useFilter<T extends Record<string, unknown>>(
  items: T[],
  searchFields: (keyof T)[]
) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Partial<Record<keyof T, string>>>({});
  const debouncedSearch = useDebounce(search, 300);

  const filteredItems = items.filter((item) => {
    // Filtro de búsqueda de texto
    if (debouncedSearch) {
      const matches = searchFields.some((field) => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(debouncedSearch.toLowerCase());
      });
      if (!matches) return false;
    }

    // Filtros específicos por campo
    for (const [key, value] of Object.entries(filters)) {
      if (value && item[key as keyof T] !== value) return false;
    }

    return true;
  });

  const setFilter = useCallback((key: keyof T, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    setFilters({});
  }, []);

  return {
    search,
    setSearch,
    filters,
    setFilter,
    clearFilters,
    filteredItems,
  };
}
