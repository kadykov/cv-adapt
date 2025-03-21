import { describe, test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderExperience,
  validateDescription,
  validateDateDisplay,
  validateIconAccessibility,
  testEditButton,
  validateHeading,
} from '../utils';
import {
  mockExperience,
  createMinimalExperience,
  createCurrentPosition,
} from '../fixtures';

describe('Experience', () => {
  test('renders complete experience details correctly', () => {
    renderExperience({ experience: mockExperience });

    // Check position and company info
    validateHeading(mockExperience.position);
    expect(screen.getByText(mockExperience.company.name)).toBeInTheDocument();
    expect(screen.getByText(mockExperience.description)).toBeInTheDocument();

    // Check company location if available
    if (mockExperience.company.location) {
      expect(
        screen.getByText(mockExperience.company.location),
      ).toBeInTheDocument();
    }

    // Verify date formatting
    if (mockExperience.start_date) {
      validateDateDisplay(
        mockExperience.start_date,
        mockExperience.end_date || undefined,
      );
    }

    // Check description formatting
    validateDescription(mockExperience.description);

    // Verify technologies
    if (mockExperience.technologies?.length) {
      mockExperience.technologies.forEach((tech) => {
        expect(screen.getByText(tech)).toBeInTheDocument();
        expect(screen.getByText(tech)).toHaveClass(
          'bg-primary/10',
          'text-primary',
        );
      });
    }
  });

  test('handles current position correctly', () => {
    const currentPosition = createCurrentPosition(mockExperience);
    renderExperience({ experience: currentPosition });

    // Date should show "Present" for end date
    const dateText = screen.getByTestId('date-range');
    expect(dateText).toHaveTextContent(/Present/);

    if (currentPosition.start_date) {
      validateDateDisplay(currentPosition.start_date);
    }
  });

  test('handles minimal experience details', () => {
    const minimalExperience = createMinimalExperience();
    renderExperience({ experience: minimalExperience });

    // Required fields should be present
    expect(screen.getByText(minimalExperience.position)).toBeInTheDocument();
    expect(
      screen.getByText(minimalExperience.company.name),
    ).toBeInTheDocument();

    // Optional fields should not be rendered
    expect(screen.queryByText(/technologies/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/location/i)).not.toBeInTheDocument();

    // Check start date formatting
    if (minimalExperience.start_date) {
      validateDateDisplay(minimalExperience.start_date);
    }
  });

  test('handles edit button interaction', async () => {
    const onEdit = vi.fn();
    renderExperience({ experience: mockExperience }, { onEdit });

    const button = screen.getByRole('button', {
      name: /edit experience/i,
    });
    expect(button).toHaveAttribute('title', 'Edit experience details');

    await testEditButton(onEdit);
  });

  test('maintains accessibility and semantic structure', () => {
    renderExperience({ experience: mockExperience });

    // Position should be a heading
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent(mockExperience.position);
    expect(heading.tagName).toBe('H4');

    // Date icon should be decorative
    validateIconAccessibility('calendar-icon');

    // Verify semantic structure
    expect(screen.getByText(mockExperience.company.name)).toHaveClass(
      'text-sm',
      'text-gray-600',
    );

    // Description should be properly formatted
    validateDescription(mockExperience.description);
  });

  test('renders technologies with proper styling', () => {
    renderExperience({ experience: mockExperience });

    if (mockExperience.technologies?.length) {
      const techSection = screen.getByText('Technologies:');
      expect(techSection).toHaveClass('text-sm', 'text-gray-600', 'mb-1');

      const techContainer = techSection.nextElementSibling;
      expect(techContainer).toHaveClass('flex', 'flex-wrap', 'gap-2');

      mockExperience.technologies.forEach((tech) => {
        const techElement = screen.getByText(tech);
        expect(techElement).toHaveClass(
          'inline-flex',
          'items-center',
          'px-2.5',
          'py-0.5',
          'rounded-full',
          'text-xs',
          'font-medium',
          'bg-primary/10',
          'text-primary',
        );
      });
    }
  });
});
