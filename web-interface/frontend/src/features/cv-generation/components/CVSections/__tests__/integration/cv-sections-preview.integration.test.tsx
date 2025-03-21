import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PersonalInfo } from '../../PersonalInfo';
import { Experience } from '../../Experience';
import { Education } from '../../Education';
import { CoreCompetences } from '../../CoreCompetences';

import {
  mockPersonalInfo,
  mockExperience,
  mockEducation,
  mockCoreCompetences,
} from '../fixtures';

describe('CV Sections Integration', () => {
  test('renders all sections in correct order with consistent styling', () => {
    const { container } = render(
      <div className="space-y-6" data-testid="cv-preview">
        <PersonalInfo personalInfo={mockPersonalInfo} onEdit={() => {}} />
        <CoreCompetences competences={mockCoreCompetences} onEdit={() => {}} />
        <Experience experience={mockExperience} onEdit={() => {}} />
        <Education education={mockEducation} onEdit={() => {}} />
      </div>,
    );

    // Verify sections are rendered in correct order
    const sections = container.children[0].children;
    expect(sections[0]).toHaveTextContent(mockPersonalInfo.full_name);
    expect(sections[1]).toHaveTextContent('Core Competences');
    expect(sections[2]).toHaveTextContent(mockExperience.position);
    expect(sections[3]).toHaveTextContent(mockEducation.university.name);

    // Check consistent spacing between sections
    expect(container.firstChild).toHaveClass('space-y-6');
  });

  test('maintains heading hierarchy across sections', () => {
    render(
      <div data-testid="cv-preview">
        <PersonalInfo personalInfo={mockPersonalInfo} onEdit={() => {}} />
        <CoreCompetences competences={mockCoreCompetences} onEdit={() => {}} />
        <Experience experience={mockExperience} onEdit={() => {}} />
        <Education education={mockEducation} onEdit={() => {}} />
      </div>,
    );

    const headings = screen.getAllByRole('heading');

    // Name should be most prominent
    expect(headings[0]).toHaveTextContent(mockPersonalInfo.full_name);
    expect(headings[0]).toHaveClass('text-xl');

    // Other sections should have consistent styling
    const sectionHeadings = headings.slice(1);
    sectionHeadings.forEach((heading) => {
      expect(heading).toHaveClass('font-medium');
      expect(heading.tagName).toBe('H4');
    });
  });

  test('handles edit interactions independently', async () => {
    const user = userEvent.setup();
    const editHandlers = {
      personal: vi.fn(),
      competences: vi.fn(),
      experience: vi.fn(),
      education: vi.fn(),
    };

    render(
      <div data-testid="cv-preview">
        <PersonalInfo
          personalInfo={mockPersonalInfo}
          onEdit={editHandlers.personal}
        />
        <CoreCompetences
          competences={mockCoreCompetences}
          onEdit={editHandlers.competences}
        />
        <Experience
          experience={mockExperience}
          onEdit={editHandlers.experience}
        />
        <Education education={mockEducation} onEdit={editHandlers.education} />
      </div>,
    );

    // Click each edit button
    const editButtons = screen.getAllByRole('button');
    for (const button of editButtons) {
      await user.click(button);
    }

    // Verify each handler was called exactly once
    expect(editHandlers.personal).toHaveBeenCalledTimes(1);
    expect(editHandlers.competences).toHaveBeenCalledTimes(1);
    expect(editHandlers.experience).toHaveBeenCalledTimes(1);
    expect(editHandlers.education).toHaveBeenCalledTimes(1);
  });

  test('maintains consistent date formatting across sections', () => {
    render(
      <div data-testid="cv-preview">
        <Experience experience={mockExperience} onEdit={() => {}} />
        <Education education={mockEducation} onEdit={() => {}} />
      </div>,
    );

    const dateRanges = screen.getAllByTestId('date-range');
    dateRanges.forEach((dateRange) => {
      expect(dateRange.textContent).toMatch(/[A-Z][a-z]{2} \d{4}/); // Format: "MMM YYYY"
    });
  });

  test('handles responsive layout correctly', () => {
    const { container } = render(
      <div className="w-full max-w-3xl mx-auto" data-testid="cv-preview">
        <PersonalInfo personalInfo={mockPersonalInfo} onEdit={() => {}} />
        <CoreCompetences competences={mockCoreCompetences} onEdit={() => {}} />
        <Experience experience={mockExperience} onEdit={() => {}} />
        <Education education={mockEducation} onEdit={() => {}} />
      </div>,
    );

    // Check for responsive classes
    expect(container.firstChild).toHaveClass('w-full', 'max-w-3xl', 'mx-auto');

    // Verify sections have consistent vertical spacing
    const content = screen.getByTestId('cv-preview');
    const sections = [
      mockExperience,
      mockEducation,
      mockCoreCompetences
    ].map((_, i) => content.children[i + 1]); // Skip PersonalInfo since it doesn't have mt-6

    sections.forEach((section) => {
      expect(section).toHaveClass('mt-6');
    });
  });
});
