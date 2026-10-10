import { createContext } from 'react';

// Keep the context identity separate from components refreshed or lazy-loaded by Vite.
export const PomodoroContext = createContext(null);
