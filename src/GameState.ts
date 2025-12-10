// Простая шина событий для UI
type Listener = (val: any) => void;
const listeners: Record<string, Listener[]> = {};

export const GameEvents = {
  on: (event: string, fn: Listener) => {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  },
  off: (event: string, fn: Listener) => {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((l) => l !== fn);
  },
  emit: (event: string, data: any) => {
    if (listeners[event]) listeners[event].forEach((fn) => fn(data));
  },
};
