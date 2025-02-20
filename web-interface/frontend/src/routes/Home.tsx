import { Link } from 'react-router-dom';
import { ROUTES } from './paths';

export function Home() {
  return (
    <div className="hero min-h-[calc(100vh-4rem)]">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">CV Adapt</h1>
          <p className="py-6">
            Intelligent CV customization and generation with multilingual
            support
          </p>
          <Link to={ROUTES.JOBS.LIST} className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
