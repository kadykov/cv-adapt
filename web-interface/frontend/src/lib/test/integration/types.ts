import type { RenderOptions } from '@testing-library/react';
import type { ReactNode } from 'react';

export type TestOptions = Omit<RenderOptions, 'wrapper'> & {
  initialEntries?: string[];
  routerComponent?: React.ComponentType<{ children: ReactNode }>;
};
