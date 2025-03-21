import { describe, test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderEducation,
  validateDescription,
  validateDateDisplay,
  validateIconAccessibility,
  testEditButton,
  validateHeading,
} from '../utils';
import { mockEducation, createMinimalEducation } from '../fixtures';

describe('Education', () => {
  test('renders complete education details correctly', () => {
    renderEducation({ education: mockEducation });

    // Check university and degree info
    validateHeading(mockEducation.university.name);
    expect(screen.getByText(mockEducation.degree)).toBeInTheDocument();

    // Check location if available
    if (mockEducation.university.location) {
      expect(
        screen.getByText(mockEducation.university.location),
      ).toBeInTheDocument();
    }

    // Verify date formatting
    if (mockEducation.start_date) {
      validateDateDisplay(
        mockEducation.start_date,
        mockEducation.end_date || undefined,
      );
    }

    // Check descriptions
    if (mockEducation.university.description) {
      validateDescription(mockEducation.university.description, 'secondary');
    }

    if (mockEducation.description) {
      validateDescription(mockEducation.description, 'primary');
    }
  });

  test('handles ongoing education correctly', () => {
    const currentEducation = {
      ...mockEducation,
      end_date: undefined,
    };

    renderEducation({ education: currentEducation });

    // Date should show "Present" for end date
    const dateText = screen.getByTestId('date-range');
    expect(dateText).toHaveTextContent(/Present/);

    if (currentEducation.start_date) {
      validateDateDisplay(currentEducation.start_date);
    }
  });

  test('handles minimal education details', () => {
    const minimalEducation = createMinimalEducation();
    renderEducation({ education: minimalEducation });

    // Required fields should be present
    expect(
      screen.getByText(minimalEducation.university.name),
    ).toBeInTheDocument();
    expect(screen.getByText(minimalEducation.degree)).toBeInTheDocument();

    // Optional fields should not be rendered
    expect(screen.queryByText(/location/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/university description/i),
    ).not.toBeInTheDocument();

    // Check start date formatting
    if (minimalEducation.start_date) {
      validateDateDisplay(minimalEducation.start_date);
    }
  });

  test('handles edit button interaction', async () => {
    const onEdit = vi.fn();
    renderEducation({ education: mockEducation }, { onEdit });

    const button = screen.getByRole('button', {
      name: /edit education/i,
    });
    expect(button).toHaveAttribute('title', 'Edit education details');

    await testEditButton(onEdit);
  });

  test('maintains accessibility and semantic structure', () => {
    renderEducation({ education: mockEducation });

    // University name should be a heading
    const heading = screen.getByRole('heading');
    expect(heading).toHaveTextContent(mockEducation.university.name);
    expect(heading.tagName).toBe('H4');

    // Date icon should be decorative
    validateIconAccessibility('calendar-icon');

    // Proper text hierarchy
    expect(screen.getByText(mockEducation.degree)).toHaveClass(
      'text-sm',
      'font-medium',
      'text-gray-700',
    );

    if (mockEducation.university.location) {
      expect(screen.getByText(mockEducation.university.location)).toHaveClass(
        'text-sm',
        'text-gray-500',
      );
    }
  });

  test('preserves whitespace in descriptions', () => {
    const educationWithMultiline = {
      ...mockEducation,
      description: 'First line\nSecond line\nThird line',
    };

    renderEducation({ education: educationWithMultiline });

    const description = screen.getByText((_content, element) => {
      if (!element) return false;

      return (
        element.tagName.toLowerCase() === 'p' &&
        !!element.textContent &&
        element.textContent.includes('First line') &&
        element.textContent.includes('Second line') &&
        element.textContent.includes('Third line')
      );
    });
    expect(description).toHaveClass('whitespace-pre-line');
  });

  test('arranges information in correct visual hierarchy', () => {
    renderEducation({ education: mockEducation });

    const container = screen.getByTestId('education-content');

    // Verify correct stacking
    expect(container).toHaveClass('space-y-1');

    // Check elements order in DOM
    const elements = container.children;
    expect(elements[0]).toHaveTextContent(mockEducation.university.name); // Heading
    expect(elements[1]).toHaveTextContent(mockEducation.degree); // Degree
    expect(elements[2]).toHaveTextContent(
      mockEducation.university.location || '',
    ); // Location
  });
});
