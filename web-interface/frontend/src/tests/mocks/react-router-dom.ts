import { vi } from 'vitest';

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => children;
export const Routes = ({ children }: { children: React.ReactNode }) => children;
export const Route = ({ children }: { children: React.ReactNode }) => children;
export const Link = ({ children }: { children: React.ReactNode }) => children;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const Navigate = ({ to }: { to: string }) => null;
export const Outlet = () => null;

export const useNavigate = vi.fn();
export const useLocation = vi.fn(() => ({ pathname: '/' }));
export const useParams = vi.fn(() => ({}));
export const useMatch = vi.fn();
