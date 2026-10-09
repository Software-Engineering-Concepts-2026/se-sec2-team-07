import { useRef } from 'react';

export default function SearchField({ label, placeholder, value, onChange }) {
  const input = useRef(null);
  return (
    <div className="search-field">
      <label className="field">
        <span>{label}</span>
        <input
          ref={input}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {value && (
        <button
          type="button"
          className="search-clear"
          aria-label={`ล้าง${label}`}
          onClick={() => {
            onChange('');
            input.current?.focus();
          }}
        >
          ล้าง
        </button>
      )}
    </div>
  );
}
