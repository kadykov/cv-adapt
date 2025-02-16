import { BaseService } from './base-service';
import { DetailedCVService } from './cv-service';
import { JobService } from './job-service';
import { AuthService } from './auth-service';

export {
  BaseService,
  DetailedCVService,
  JobService,
  AuthService
};

// Factory functions for creating services
function createDetailedCVService(): DetailedCVService {
  return new DetailedCVService();
}

function createJobService(): JobService {
  return new JobService();
}

function createAuthService(): AuthService {
  return new AuthService();
}

// Create singleton instances for commonly used services
export const authService = createAuthService();
export const jobService = createJobService();
export const cvService = createDetailedCVService();

// Export factory functions
export {
  createDetailedCVService,
  createJobService,
  createAuthService
};
