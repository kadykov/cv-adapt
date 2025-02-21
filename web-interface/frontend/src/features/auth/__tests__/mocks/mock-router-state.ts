import { vi } from 'vitest';

export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/protected',
  search: '',
  hash: '',
  state: null,
};
