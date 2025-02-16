import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { JobList } from './job-list';
import * as services from '../../types/services';
import {
  render,
  waitForLoadingToComplete,
  createErrorJobService,
  getButton,
  getSelect,
  waitForText,
  expectErrorMessage,
  expectServiceCall,
  resetServiceCalls,
  createMockJobService,
  mockData,
  verifyAccessibility,
  verifyAnnouncements,
  testKeyboardShortcut,
  testIds,
  patterns,
  shortcuts
} from '../../test';

describe('JobList', () => {
  const mockJobs = [
    mockData.job(),
    {
      ...mockData.job(),
      id: 2,
      title: 'Frontend Developer',
      language_code: 'fr'
    }
  ];

  let mockJobService = createMockJobService(mockJobs);

  beforeEach(() => {
    // Create fresh mock service for each test
    mockJobService = createMockJobService(mockJobs);
    // Mock the exported singleton instance
    vi.spyOn(services, 'jobService', 'get').mockReturnValue(mockJobService);
  });

  describe('Initial Loading', () => {
    it('renders loading state initially', () => {
      render(<JobList />);
      expect(screen.getByText('Loading jobs...')).toBeInTheDocument();
    });

    it('renders jobs after loading', async () => {
      render(<JobList />);

      await waitForLoadingToComplete();

      await waitForText('Software Engineer');
      await waitForText('Frontend Developer');

      // Verify initial service call
      expectServiceCall(mockJobService, 'getJobs');
    });

    it('displays no jobs message when list is empty', async () => {
      mockJobService = createMockJobService([]);
      vi.spyOn(services, 'jobService', 'get').mockReturnValue(mockJobService);

      render(<JobList />);
      await waitForLoadingToComplete();

      await waitForText(/No jobs found/i);
    });
  });

  describe('Language Filtering', () => {
    it('filters jobs by language', async () => {
      render(<JobList />);
      await waitForLoadingToComplete();

      // Change language to French
      const languageSelect = getSelect(/language/i);
      fireEvent.change(languageSelect, { target: { value: 'fr' } });

      // Verify the service was called with correct language
      expectServiceCall(mockJobService, 'getJobs', ['fr']);
    });

    it('maintains selected language after refresh', async () => {
      render(<JobList />);
      await waitForLoadingToComplete();

      // Select French
      const languageSelect = getSelect(/language/i);
      fireEvent.change(languageSelect, { target: { value: 'fr' } });

      // Reset mock calls
      resetServiceCalls(mockJobService, 'getJobs');

      // Click refresh button
      fireEvent.click(getButton(/refresh/i));

      // Verify the service was called with previously selected language
      expectServiceCall(mockJobService, 'getJobs', ['fr']);
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility requirements', async () => {
      const view = render(<JobList />);
      await waitForLoadingToComplete();

      await verifyAccessibility(view, {
        focusOrder: patterns.focusOrder.jobList,
        ariaLabels: patterns.ariaLabels.jobList,
        ariaLive: true,
        requiredControls: []
      });
    });

    it('supports keyboard shortcuts', async () => {
      render(<JobList />);
      await waitForLoadingToComplete();

      // Test refresh shortcut
      testKeyboardShortcut(
        shortcuts.jobList.refresh.key,
        { ctrl: shortcuts.jobList.refresh.ctrl },
        testIds.jobList.refreshButton
      );

      // Test language filter shortcut
      testKeyboardShortcut(
        shortcuts.jobList.languageFilter.key,
        { ctrl: shortcuts.jobList.languageFilter.ctrl },
        testIds.jobList.languageSelect
      );
    });

    it('announces status changes', async () => {
      render(<JobList />);

      await verifyAnnouncements([
        'Loading jobs',
        'Jobs loaded',
        'Deleting job',
        'Job deleted successfully'
      ]);
    });
  });

  describe('Job Operations', () => {
    it('deletes a job with confirmation', async () => {
      render(<JobList />);
      await waitForLoadingToComplete();

      // Click delete button
      fireEvent.click(getButton(/delete/i));

      // Verify confirmation dialog
      await waitForText(/Are you sure/i);
      expect(getButton(/confirm/i)).toBeInTheDocument();
      expect(getButton(/cancel/i)).toBeInTheDocument();

      // Confirm deletion
      fireEvent.click(getButton(/confirm/i));

      // Verify service calls
      expectServiceCall(mockJobService, 'deleteJob', [mockJobs[0].id]);
      expectServiceCall(mockJobService, 'getJobs');
    });

    it('cancels job deletion', async () => {
      render(<JobList />);
      await waitForLoadingToComplete();

      // Start deletion
      fireEvent.click(getButton(/delete/i));
      await waitForText(/Are you sure/i);

      // Cancel deletion
      fireEvent.click(getButton(/cancel/i));

      // Verify service was not called
      expect(mockJobService.deleteJob).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error when job loading fails', async () => {
      const errorService = createErrorJobService(new Error('Failed to fetch jobs'));
      vi.spyOn(services, 'jobService', 'get').mockReturnValue(errorService);

      render(<JobList />);

      await expectErrorMessage(/Error loading jobs/i);
    });

    it('allows retrying after error', async () => {
      const errorService = createErrorJobService(new Error('Failed to fetch jobs'));
      vi.spyOn(services, 'jobService', 'get').mockReturnValue(errorService);

      render(<JobList />);
      await expectErrorMessage(/Error loading jobs/i);

      // Setup success case for retry
      vi.spyOn(services, 'jobService', 'get').mockReturnValue(mockJobService);

      // Click retry button
      fireEvent.click(getButton(/retry/i));

      // Verify data loads successfully
      await waitForText('Software Engineer');
    });
  });
});
