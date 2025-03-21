import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PersonalInfo } from '../../PersonalInfo';
import { Experience } from '../../Experience';
import { Education } from '../../Education';
import { CoreCompetences } from '../../CoreCompetences';

import { mockPersonalInfo, mockExperience, mockEducation } from '../fixtures';

describe('CV Sections Error Handling', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('handles invalid personal info gracefully', () => {
    const invalidPersonalInfo = {
      ...mockPersonalInfo,
      full_name: undefined,
    };

    render(
      <PersonalInfo
        // @ts-expect-error Testing invalid prop
        personalInfo={invalidPersonalInfo}
        onEdit={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  test('handles invalid dates in experience section', () => {
    const invalidExperience = {
      ...mockExperience,
      start_date: 'invalid-date',
    };

    render(<Experience experience={invalidExperience} onEdit={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
  });

  test('handles missing required fields', () => {
    render(
      <Education
        // @ts-expect-error Testing invalid education
        education={{ ...mockEducation, degree: undefined }}
        onEdit={() => {}}
      />,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('maintains other sections when one fails', () => {
    render(
      <div>
        <PersonalInfo personalInfo={mockPersonalInfo} onEdit={() => {}} />
        <CoreCompetences
          // @ts-expect-error Testing invalid competences
          competences={null}
          onEdit={() => {}}
        />
        <Experience experience={mockExperience} onEdit={() => {}} />
      </div>,
    );

    // Valid sections should render
    expect(screen.getByText(mockPersonalInfo.full_name)).toBeInTheDocument();
    expect(screen.getByText(mockExperience.position)).toBeInTheDocument();

    // Invalid section should show error
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('shows helpful error messages', () => {
    render(
      <CoreCompetences
        // @ts-expect-error Testing invalid competences
        competences="not-an-array"
        onEdit={() => {}}
      />,
    );

    const error = screen.getByRole('alert');
    expect(error).toHaveTextContent(/invalid/i);
    expect(error).toBeVisible();
  });

  test('preserves error boundary styling', () => {
    render(
      <PersonalInfo
        // @ts-expect-error Testing missing required prop
        personalInfo={{}}
        onEdit={() => {}}
      />,
    );

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toHaveClass('bg-error-50', 'text-error-700');
  });
});
