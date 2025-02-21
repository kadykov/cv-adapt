import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';

type RouterWrapperProps = {
  children: ReactNode;
  initialEntries?: string[];
};

export function RouterWrapper({
  children,
  initialEntries = ['/'],
}: RouterWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
}
