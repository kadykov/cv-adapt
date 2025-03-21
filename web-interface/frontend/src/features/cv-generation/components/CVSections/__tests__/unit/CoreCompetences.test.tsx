import { describe, test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderCoreCompetences,
  validateHeading,
  validateList,
  testEditButton,
  validateEmptyState,
} from '../utils';
import { mockCoreCompetences } from '../fixtures';

describe('CoreCompetences', () => {
  test('renders competences correctly', () => {
    renderCoreCompetences({ competences: mockCoreCompetences });

    // Validate heading and structure
    validateHeading('Core Competences');

    // Validate list content
    validateList(mockCoreCompetences.map((comp) => comp.text));
  });

  test('shows edit button when onEdit is provided', async () => {
    const onEdit = vi.fn();
    renderCoreCompetences({ competences: mockCoreCompetences }, { onEdit });

    const button = screen.getByRole('button', {
      name: /edit core competences/i,
    });
    expect(button).toHaveAttribute('title', 'Edit competences');

    await testEditButton(onEdit);
  });

  test('does not show edit button when onEdit is not provided', () => {
    renderCoreCompetences({ competences: mockCoreCompetences });
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('returns null when competences array is empty', () => {
    const { container } = renderCoreCompetences({ competences: [] });
    validateEmptyState(container);
  });

  test('accepts custom title', () => {
    renderCoreCompetences({
      competences: mockCoreCompetences,
      title: 'Key Skills',
    });

    validateHeading('Key Skills');
  });

  test('maintains accessibility attributes', () => {
    renderCoreCompetences({ competences: mockCoreCompetences });

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('role', 'list');

    // Check if list items have the expected accessibility structure
    const listItems = screen.getAllByRole('listitem');
    listItems.forEach((item) => {
      // Each list item should have an icon container with proper aria-hidden
      const iconContainer = item.querySelector('.size-5');
      expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
