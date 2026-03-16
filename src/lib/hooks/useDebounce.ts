"use client";

import { useEffect, useState } from "react";

/**
 * Delay value updates until user stops typing
 */
export default function useDebounce<T>(
  value: T,
  delay = 800
) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {

    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);

  }, [value, delay]);

  return debounced;
}