import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { expect, describe, it, beforeEach, vi } from 'vitest';
import CVModal from '../CVModal';
import { CVDTO } from '../../types/api';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
window.URL.createObjectURL = mockCreateObjectURL;
window.URL.revokeObjectURL = mockRevokeObjectURL;

describe('CVModal', () => {
  // Minimal CV data with required fields only
  const minimalCVData: CVDTO = {
    personal_info: {
      full_name: 'John Doe',
      email: {
        value: 'john@example.com',
        type: 'Email',
      },
    },
    title: {
      text: 'Software Engineer',
    },
    summary: {
      text: 'Experienced software engineer',
    },
    core_competences: [
      { text: 'Programming' },
    ],
    experiences: [
      {
        company: {
          name: 'Tech Corp',
        },
        position: 'Software Engineer',
        start_date: '2020-01',
      },
    ],
    education: [
      {
        university: {
          name: 'University',
        },
        degree: 'Computer Science',
        start_date: '2015-01',
      },
    ],
    skills: [
      {
        name: 'Programming Languages',
        skills: [
          { text: 'Python' },
        ],
      },
    ],
    language: {
      code: 'en',
    },
  };

  // Full CV data with all optional fields
  const fullCVData: CVDTO = {
    personal_info: {
      full_name: 'John Doe',
      email: {
        value: 'john@example.com',
        type: 'Email',
        icon: 'email',
        url: 'mailto:john@example.com',
      },
      phone: {
        value: '+1234567890',
        type: 'Phone',
        icon: 'phone',
        url: 'tel:+1234567890',
      },
      location: {
        value: 'San Francisco, CA',
        type: 'Location',
        icon: 'location',
      },
      linkedin: {
        value: 'linkedin.com/in/johndoe',
        type: 'LinkedIn',
        icon: 'linkedin',
        url: 'https://linkedin.com/in/johndoe',
      },
      github: {
        value: 'github.com/johndoe',
        type: 'GitHub',
        icon: 'github',
        url: 'https://github.com/johndoe',
      },
    },
    title: {
      text: 'Senior Software Engineer',
    },
    summary: {
      text: 'Experienced software engineer with 10+ years...',
    },
    core_competences: [
      { text: 'Programming' },
      { text: 'System Design' },
    ],
    experiences: [
      {
        company: {
          name: 'Tech Corp',
          description: 'Leading tech company',
          location: 'San Francisco, CA',
        },
        position: 'Senior Software Engineer',
        start_date: '2020-01',
        end_date: '2023-12',
        description: 'Led team of 5 engineers',
        technologies: ['Python', 'TypeScript', 'React'],
      },
    ],
    education: [
      {
        university: {
          name: 'University of Technology',
          description: 'Top CS school',
          location: 'San Francisco, CA',
        },
        degree: 'Master of Computer Science',
        start_date: '2015-01',
        end_date: '2017-12',
        description: 'Focus on AI and ML',
      },
    ],
    skills: [
      {
        name: 'Programming Languages',
        skills: [
          { text: 'Python' },
          { text: 'TypeScript' },
        ],
      },
    ],
    language: {
      code: 'en',
    },
  };

  beforeEach(() => {
    // Clear mock calls between tests
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <CVModal
        isOpen={false}
        onClose={() => {}}
        cvData={minimalCVData}
      />
    );
    expect(screen.queryByText('Generated CV')).not.toBeInTheDocument();
  });

  it('should render with minimal required data', () => {
    render(
      <CVModal
        isOpen={true}
        onClose={() => {}}
        cvData={minimalCVData}
      />
    );

    // Check required fields are rendered
    // Headers and titles
    expect(screen.getByRole('heading', { name: 'Generated CV' })).toBeInTheDocument();

    // Personal information
    expect(screen.getByText((content) => content.includes('John Doe'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('john@example.com'))).toBeInTheDocument();

    // Title
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toBeInTheDocument();
    const titleElement = screen.getByText((content, element) => {
      return content.includes('Software Engineer') && element?.previousElementSibling?.textContent === 'Title';
    });
    expect(titleElement).toBeInTheDocument();

    // Core competences
    expect(screen.getByRole('heading', { name: 'Core Competences' })).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();

    // Experience
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Tech Corp'))).toBeInTheDocument();

    // Education
    expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('University'))).toBeInTheDocument();

    // Skills
    expect(screen.getByRole('heading', { name: 'Skills' })).toBeInTheDocument();
    expect(screen.getByText('Programming Languages')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('should render all optional fields when provided', () => {
    render(
      <CVModal
        isOpen={true}
        onClose={() => {}}
        cvData={fullCVData}
      />
    );

    // Check that all contact information is rendered
    expect(screen.getByText((content) => content.includes('+1234567890'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('linkedin.com/in/johndoe'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('github.com/johndoe'))).toBeInTheDocument();

    // Check all instances of San Francisco, CA
    const locationEntries = screen.getAllByText((content) => content.includes('San Francisco, CA'));
    expect(locationEntries.length).toBe(3); // Personal info, company, and university

    // Check additional fields in detail sections
    expect(screen.getByRole('heading', { name: 'Senior Software Engineer' })).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Led team of 5 engineers'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Tech Corp'))).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Master of Computer Science' })).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('University of Technology'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('Focus on AI and ML'))).toBeInTheDocument();

    // Verify skills section
    expect(screen.getByText('Programming Languages')).toBeInTheDocument();
    const pythonElements = screen.getAllByText('Python');
    expect(pythonElements).toHaveLength(2); // One in skills, one in technologies
    expect(screen.getAllByText('TypeScript')).toHaveLength(2); // One in skills, one in technologies

    // Verify core competences
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();

    // Verify technologies list
    expect(screen.getByText('React')).toBeInTheDocument(); // Only appears in technologies
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <CVModal
        isOpen={true}
        onClose={onClose}
        cvData={minimalCVData}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should handle download functionality', () => {
    const mockAppendChild = vi.spyOn(document.body, 'appendChild');
    const mockRemoveChild = vi.spyOn(document.body, 'removeChild');

    render(
      <CVModal
        isOpen={true}
        onClose={() => {}}
        cvData={minimalCVData}
      />
    );

    fireEvent.click(screen.getByText('Download CV'));

    // Check if Blob was created and URL was generated
    expect(mockCreateObjectURL).toHaveBeenCalled();
    // Check if cleanup was performed
    expect(mockRevokeObjectURL).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();

    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });
});
