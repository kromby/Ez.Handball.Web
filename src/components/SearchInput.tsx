import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

export function SearchInput({
  initialValue,
  placeholder,
  clearLabel,
  onSearch,
}: {
  initialValue: string;
  placeholder: string;
  clearLabel: string;
  onSearch: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  // Re-seed local state when the external value changes (back-nav, shared URL).
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Debounce the outgoing search whenever the typed value changes.
  useEffect(() => {
    if (value === initialValue) return; // no-op on the seed pass
    const id = setTimeout(() => onSearchRef.current(value), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value, initialValue]);

  function clear() {
    setValue("");
    onSearchRef.current("");
  }

  return (
    <div className="search-input">
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
      />
      {value !== "" && (
        <button type="button" className="search-input-clear" aria-label={clearLabel} onClick={clear}>
          ✕
        </button>
      )}
    </div>
  );
}
