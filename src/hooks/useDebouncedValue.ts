"use client";

import { useEffect, useState } from "react";

/** Delays reflecting `value` until it's stable for `delayMs` — for wiring a
 *  search input to a backend `q` param without firing a request per keystroke. */
export function useDebouncedValue<T>(value: T, delayMs = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
