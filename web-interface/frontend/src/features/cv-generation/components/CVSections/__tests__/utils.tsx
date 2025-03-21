import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import components and types
import { PersonalInfo } from '../PersonalInfo';
import { Experience } from '../Experience';
import { Education } from '../Education';
import { CoreCompetences } from '../CoreCompetences';
import type { PersonalInfoProps } from '../PersonalInfo';
import type { ExperienceProps } from '../Experience';
import type { EducationProps } from '../Education';
import type { CoreCompetencesProps } from '../CoreCompetences';

/**
 * Helper to render PersonalInfo component
 */
export function renderPersonalInfo(
  props: Omit<PersonalInfoProps, 'onEdit'>,
  options: { onEdit?: () => void } = {},
) {
  const { onEdit = vi.fn() } = options;
  return render(<PersonalInfo {...props} onEdit={onEdit} />);
}

/**
 * Helper to render Experience component
 */
export function renderExperience(
  props: Omit<ExperienceProps, 'onEdit'>,
  options: { onEdit?: () => void } = {},
) {
  const { onEdit = vi.fn() } = options;
  return render(<Experience {...props} onEdit={onEdit} />);
}

/**
 * Helper to render Education component
 */
export function renderEducation(
  props: Omit<EducationProps, 'onEdit'>,
  options: { onEdit?: () => void } = {},
) {
  const { onEdit = vi.fn() } = options;
  return render(<Education {...props} onEdit={onEdit} />);
}

/**
 * Helper to render CoreCompetences component
 */
export function renderCoreCompetences(
  props: Omit<CoreCompetencesProps, 'onEdit'>,
  options: { onEdit?: () => void } = {},
) {
  return render(<CoreCompetences {...props} onEdit={options.onEdit} />);
}

/**
 * Helper to test edit button interactions
 */
export async function testEditButton(onEditMock = vi.fn()) {
  const user = userEvent.setup();
  const button = screen.getByRole('button', { name: /edit/i });
  await user.click(button);
  expect(onEditMock).toHaveBeenCalledTimes(1);
  return { button, user, onEdit: onEditMock };
}

/**
 * Verifies section heading structure and accessibility
 */
export function validateHeading(expectedText: string) {
  const heading = screen.getByRole('heading');
  expect(heading).toHaveTextContent(expectedText);
  expect(heading.tagName).toBe('H4');
  expect(heading).toHaveClass('font-medium');
}

/**
 * Verifies date display format and accessibility
 */
export function validateDateDisplay(startDate: string, endDate?: string) {
  const dateElement = screen.getByTestId('date-range');
  expect(dateElement).toHaveAttribute('aria-label', 'Date range');

  const formattedStart = new Date(startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  const formattedEnd = endDate
    ? new Date(endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : 'Present';

  expect(dateElement).toHaveTextContent(`${formattedStart} - ${formattedEnd}`);
}

/**
 * Verifies external link attributes for security and accessibility
 */
export function validateExternalLink(url: string, text: string) {
  const link = screen.getByRole('link', { name: text });
  expect(link).toHaveAttribute('href', url);
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
}

/**
 * Verifies icon accessibility attributes
 */
export function validateIconAccessibility(testId: string) {
  const icon = screen.getByTestId(testId);
  expect(icon).toHaveAttribute('aria-hidden', 'true');
  expect(icon).toHaveClass('size-4');
}

/**
 * Creates a test container with standard margins and spacing
 */
export function createTestContainer(children: React.ReactNode) {
  return (
    <div className="mt-6 space-y-4" data-testid="cv-section">
      {children}
    </div>
  );
}

/**
 * Validates empty/null state handling
 */
export function validateEmptyState(container: HTMLElement) {
  expect(container).toBeEmptyDOMElement();
}

/**
 * Validates description text formatting
 */
export function validateDescription(
  text: string,
  variant: 'primary' | 'secondary' = 'primary',
) {
  const element = screen.getByText(text);
  expect(element).toHaveClass(
    'text-sm',
    variant === 'primary' ? 'text-gray-700' : 'text-gray-600',
  );
}

/**
 * Validates list structure and items
 */
export function validateList(items: string[]) {
  const list = screen.getByRole('list');
  expect(list).toBeInTheDocument();

  const listItems = screen.getAllByRole('listitem');
  expect(listItems).toHaveLength(items.length);

  items.forEach((item, index) => {
    expect(listItems[index]).toHaveTextContent(item);
  });
}
