import { createContext, useContext } from 'react';

export const HideCtx = createContext(false);
export function useHide() { return useContext(HideCtx); }

export function mask(val: string | number): string {
  return String(val).replace(/\d/g, '•');
}

export function V({ children }: { children: string | number }) {
  const h = useHide();
  return <>{h ? mask(children) : children}</>;
}
