// hooks/useDebounce.ts
import { useState, useEffect } from "react";

/*
  Custom hook that debounces any changing value by a specified delay.
  Useful for search inputs, auto-saves, and live API filtering.
*/
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}