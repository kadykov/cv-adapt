import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CVGenerator } from './cv-generator';
import * as services from '../../types/services';
import {
  render,
  waitForLoadingToComplete,
  createErrorJobService,
  createErrorCVService,
  getButton,
  getSelect,
  waitForText,
  expectErrorMessage,
  expectServiceCall,
  verifyAccessibility,
  verifyAnnouncements,
  testKeyboardShortcut,
  createMockJobService,
  createMockDetailedCVService,
  mockData,
  testIds,
  patterns,
  shortcuts,
  builders
} from '../../test';

describe('CVGenerator', () => {
  const mockJobs = [builders.job()];
  const mockCVs = [builders.cv('en')];

  let mockJobService = createMockJobService(mockJobs);
  let mockCVService = createMockDetailedCVService(mockCVs);

  beforeEach(() => {
    mockJobService = createMockJobService(mockJobs);
    mockCVService = createMockDetailedCVService(mockCVs);
    vi.spyOn(services, 'jobService', 'get').mockReturnValue(mockJobService);
    vi.spyOn(services, 'cvService', 'get').mockReturnValue(mockCVService);
  });

  describe('Initial Loading', () => {
    it('renders loading state initially', () => {
      render(<CVGenerator />);
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    it('renders form after loading', async () => {
      render(<CVGenerator />);
      await waitForLoadingToComplete();

      // Check for form elements
      expect(getSelect(/Select job/i)).toBeInTheDocument();
      await waitForText(mockJobs[0].title);

      expect(getSelect(/Select CV/i)).toBeInTheDocument();
      await waitForText(/Primary CV/i);

      // Verify initial service calls
      expectServiceCall(mockJobService, 'getJobs');
      expectServiceCall(mockCVService, 'getAllDetailedCVs');
    });
  });

  describe('Accessibility', () => {
    it('meets accessibility requirements', async () => {
      const view = render(<CVGenerator />);
      await waitForLoadingToComplete();

      await verifyAccessibility(view, {
        focusOrder: patterns.focusOrder.cvGenerator,
        ariaLabels: patterns.ariaLabels.cvGenerator,
        ariaLive: true,
        requiredControls: patterns.ariaRequired.cvGenerator
      });
    });

    it('supports keyboard shortcuts', async () => {
      render(<CVGenerator />);
      await waitForLoadingToComplete();

      // Test job selection shortcut
      testKeyboardShortcut(
        shortcuts.cvGenerator.selectJob.key,
        { ctrl: shortcuts.cvGenerator.selectJob.ctrl },
        testIds.cvGenerator.jobSelect
      );

      // Test CV selection shortcut
      testKeyboardShortcut(
        shortcuts.cvGenerator.selectCV.key,
        { ctrl: shortcuts.cvGenerator.selectCV.ctrl },
        testIds.cvGenerator.cvSelect
      );

      // Test generate shortcut
      testKeyboardShortcut(
        shortcuts.cvGenerator.generate.key,
        { ctrl: shortcuts.cvGenerator.generate.ctrl },
        testIds.cvGenerator.generateButton
      );
    });

    it('announces status changes', async () => {
      render(<CVGenerator />);
      await verifyAnnouncements([
        'Loading data',
        'Please select a job and CV',
        'Generating CV',
        'CV Generated successfully'
      ]);
    });
  });

  describe('Form Validation', () => {
    it('requires job and CV selection', async () => {
      render(<CVGenerator />);
      await waitForLoadingToComplete();

      // Verify generate button is disabled initially
      const generateButton = getButton(/Generate/i);
      expect(generateButton).toBeDisabled();

      // Select job only
      fireEvent.change(getSelect(/Select job/i), {
        target: { value: mockJobs[0].id.toString() }
      });
      expect(generateButton).toBeDisabled();

      // Select CV as well
      fireEvent.change(getSelect(/Select CV/i), {
        target: { value: mockCVs[0].language_code }
      });
      expect(generateButton).toBeEnabled();
    });
  });

  describe('CV Generation', () => {
    it('generates CV successfully', async () => {
      render(<CVGenerator />);
      await waitForLoadingToComplete();

      // Make selections
      fireEvent.change(getSelect(/Select job/i), {
        target: { value: mockJobs[0].id.toString() }
      });
      fireEvent.change(getSelect(/Select CV/i), {
        target: { value: mockCVs[0].language_code }
      });

      // Generate CV
      fireEvent.click(getButton(/Generate/i));

      // Verify service call
      expectServiceCall(mockCVService, 'upsertDetailedCV', [
        mockCVs[0].language_code,
        expect.any(Object)
      ]);

      // Verify success state
      await waitForText(/CV Generated successfully/i);
      expect(screen.getByRole('link', { name: /Download CV/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error when job loading fails', async () => {
      const errorService = createErrorJobService(new Error('Failed to fetch jobs'));
      vi.spyOn(services, 'jobService', 'get').mockReturnValue(errorService);

      render(<CVGenerator />);
      await expectErrorMessage(/Error loading jobs/i);
    });

    it('displays error when CV loading fails', async () => {
      const errorService = createErrorCVService(new Error('Failed to fetch CVs'));
      vi.spyOn(services, 'cvService', 'get').mockReturnValue(errorService);

      render(<CVGenerator />);
      await expectErrorMessage(/Error loading CVs/i);
    });

    it('displays error when generation fails', async () => {
      render(<CVGenerator />);
      await waitForLoadingToComplete();

      // Setup error for generation
      mockCVService.upsertDetailedCV = vi.fn().mockRejectedValue(
        new Error('Generation failed')
      );

      // Make selections and attempt generation
      fireEvent.change(getSelect(/Select job/i), {
        target: { value: mockJobs[0].id.toString() }
      });
      fireEvent.change(getSelect(/Select CV/i), {
        target: { value: mockCVs[0].language_code }
      });
      fireEvent.click(getButton(/Generate/i));

      await expectErrorMessage(/Error generating CV/i);
    });
  });
});
