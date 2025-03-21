import { describe, test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  renderPersonalInfo,
  validateExternalLink,
  testEditButton,
} from '../utils';
import { mockPersonalInfo, createMinimalPersonalInfo } from '../fixtures';

describe('PersonalInfo', () => {
  test('renders complete personal info correctly', () => {
    renderPersonalInfo({ personalInfo: mockPersonalInfo });

    // Check name
    const name = screen.getByRole('heading');
    expect(name).toHaveTextContent(mockPersonalInfo.full_name);

    // Check contacts with URLs
    if (mockPersonalInfo.email?.url) {
      validateExternalLink(
        mockPersonalInfo.email.url,
        mockPersonalInfo.email.value,
      );
    }

    if (mockPersonalInfo.linkedin?.url) {
      validateExternalLink(
        mockPersonalInfo.linkedin.url,
        mockPersonalInfo.linkedin.value,
      );
    }

    // Check non-link contacts
    if (mockPersonalInfo.phone) {
      expect(
        screen.getByText(mockPersonalInfo.phone.value),
      ).toBeInTheDocument();
    }

    if (mockPersonalInfo.location) {
      expect(
        screen.getByText(mockPersonalInfo.location.value),
      ).toBeInTheDocument();
    }
  });

  test('handles minimal personal info', () => {
    const minimalInfo = createMinimalPersonalInfo();
    renderPersonalInfo({ personalInfo: minimalInfo });

    // Only name and email should be present
    expect(screen.getByText(minimalInfo.full_name)).toBeInTheDocument();
    if (minimalInfo.email) {
      expect(screen.getByText(minimalInfo.email.value)).toBeInTheDocument();
    }

    // Other contacts should not be present
    expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/linkedin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/github/i)).not.toBeInTheDocument();
  });

  test('handles edit button interaction', async () => {
    const onEdit = vi.fn();
    renderPersonalInfo({ personalInfo: mockPersonalInfo }, { onEdit });

    const button = screen.getByRole('button', {
      name: /edit personal information/i,
    });
    expect(button).toHaveAttribute('title', 'Edit personal information');

    await testEditButton(onEdit);
  });

  test('maintains accessibility for contact icons', () => {
    renderPersonalInfo({ personalInfo: mockPersonalInfo });

    // Each icon container should be marked as decorative
    const contacts = screen.getByTestId('contacts-list');
    const iconContainers = contacts.querySelectorAll('[aria-hidden="true"]');
    iconContainers.forEach((container) => {
      expect(container).toHaveClass('size-4');
    });

    // Verify we have icons for all contacts
    const expectedContactTypes = ['email', 'phone', 'location', 'linkedin'];
    expectedContactTypes.forEach((type) => {
      const contact = screen.getByTestId(`contact-${type}`);
      expect(contact).toBeInTheDocument();
    });
  });

  test('applies correct styles to contact info', () => {
    renderPersonalInfo({ personalInfo: mockPersonalInfo });

    // External links should have primary color and hover styles
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('text-primary', 'hover:underline');
    });

    // Regular contacts should have muted color
    if (mockPersonalInfo.phone) {
      const phoneText = screen.getByText(mockPersonalInfo.phone.value);
      expect(phoneText).toHaveClass('text-gray-600');
    }
  });

  test('preserves contact order', () => {
    renderPersonalInfo({ personalInfo: mockPersonalInfo });

    const contactsContainer = screen.getByTestId('contacts-list');
    const contacts = contactsContainer.querySelectorAll(
      '[data-testid^="contact-"]',
    );

    // Verify order: email, phone, location, linkedin
    const expectedOrder = ['email', 'phone', 'location', 'linkedin'];
    contacts.forEach((contact, index) => {
      expect(contact).toHaveAttribute(
        'data-testid',
        `contact-${expectedOrder[index]}`,
      );
    });
  });

  test('handles missing contact icons gracefully', () => {
    const infoWithoutIcons = {
      ...mockPersonalInfo,
      email: mockPersonalInfo.email
        ? {
            ...mockPersonalInfo.email,
            type: 'email',
            value: 'test@example.com',
            icon: undefined,
          }
        : null,
    };

    renderPersonalInfo({ personalInfo: infoWithoutIcons });

    // Contact should still be rendered with container
    const emailContact = screen.getByTestId('contact-email');
    expect(emailContact).toBeInTheDocument();
    expect(emailContact.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
