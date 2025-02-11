# Frontend Architecture

## Overview

The frontend application provides a web interface for the CV adaptation system. It handles user authentication, CV management, and generation workflows.

## Current Architecture

The frontend is built with:
- TypeScript for type safety
- React for UI components
- Tailwind CSS for styling
- Zod for runtime type validation
- Vitest for testing

## Migrating from Astro to Vite+React

### Background

The initial frontend implementation used Astro, anticipating benefits from its partial hydration and reduced JavaScript approach. However, several challenges emerged:

1. Limited SSR Benefits:
   - Most components require full client-side hydration
   - Simple pages (like login) still load 250KB+ of JavaScript
   - No effective use of partial hydration or islands architecture

2. Development Complexities:
   - Hydration testing challenges
   - Complex debugging due to SSR/CSR boundaries
   - Limited benefits from Astro's core features

### Migration Plan

#### Phase 1: Project Setup

1. Initialize new Vite project:
   ```bash
   npm create vite@latest frontend-new -- --template react-ts
   ```

2. Port configuration:
   - TypeScript configuration
   - ESLint/Prettier setup
   - Tailwind configuration
   - Vitest test configuration
   - Development server setup
   - Production build pipeline

#### Phase 2: Dependencies Setup

Core dependencies to migrate:
- Frontend core: react, react-dom, react-router-dom
- Forms: react-hook-form, @hookform/resolvers
- API integration: axios, zod
- UI framework: tailwindcss, daisyui
- Testing: vitest, @testing-library/react

#### Phase 3: Code Migration

1. Core Features:
   - Authentication context and flow
   - API services and type definitions
   - Routing configuration
   - Navigation guards

2. Components:
   - React components migration
   - Convert Astro pages to React
   - Update import paths
   - Client-side navigation implementation

3. Testing:
   - Test utilities migration
   - Update test configurations
   - Verify test coverage

#### Phase 4: Build & Deploy

1. Build Configuration:
   - Vite production setup
   - Static asset handling
   - Bundle optimization

2. CI/CD Updates:
   - Build script updates
   - Deployment configuration
   - Environment variable setup

### Success Metrics

1. Bundle Size:
   - Target: 40% reduction in initial JavaScript load
   - Per-route bundle size analysis

2. Performance:
   - Lighthouse score improvements
   - First Contentful Paint optimization
   - Time to Interactive reduction

3. Development Experience:
   - Build time improvement
   - Hot reload efficiency
   - Simplified debugging process

## Security Considerations

The frontend implements several security measures:
- CSRF protection via secure cookie handling
- Token-based authentication
- Input validation using Zod schemas
- Security headers in production builds

## Testing Strategy

The frontend uses a comprehensive testing approach:
- Unit tests with Vitest and React Testing Library
- Integration tests for API interactions
- Contract tests for API type safety
- Component testing with user event simulation
