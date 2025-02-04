import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CVModal from '../components/CVModal';
import { mockCVData } from './fixtures';

describe('CVModal Component', () => {
  it('renders nothing when closed', () => {
    render(<CVModal isOpen={false} onClose={() => {}} cvData={mockCVData} />);
    expect(screen.queryByText('Generated CV')).not.toBeInTheDocument();
  });

  it('renders modal when open', () => {
    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);
    expect(screen.getByText('Generated CV')).toBeInTheDocument();
  });

  it('renders personal information correctly', () => {
    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);

    expect(screen.getByText(mockCVData.personal_info.full_name)).toBeInTheDocument();
    expect(screen.getByText(mockCVData.personal_info.email!.value)).toBeInTheDocument();
    expect(screen.getByText(mockCVData.personal_info.phone!.value)).toBeInTheDocument();
    expect(screen.getByText(mockCVData.personal_info.location!.value)).toBeInTheDocument();
  });

  it('renders title and core competences correctly', () => {
    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);

    // Find the title specifically within the Title section
    const titleSection = screen.getByRole('heading', { name: 'Title' }).nextElementSibling;
    expect(titleSection).toHaveTextContent(mockCVData.title.text);

    mockCVData.core_competences.forEach(competence => {
      expect(screen.getByText(competence.text)).toBeInTheDocument();
    });
  });

  it('renders experience section correctly', () => {
    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);

    const experience = mockCVData.experiences[0];
    expect(screen.getByRole('heading', { level: 4, name: experience.position })).toBeInTheDocument();
    expect(screen.getByText(experience.company.name)).toBeInTheDocument();
    expect(screen.getByText(experience.company.location!)).toBeInTheDocument();
    expect(screen.getByText(experience.description!)).toBeInTheDocument();
    experience.technologies!.forEach(tech => {
      expect(screen.getByText(tech)).toBeInTheDocument();
    });
  });

  it('renders education section correctly', () => {
    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);

    const education = mockCVData.education[0];
    expect(screen.getByText(education.degree)).toBeInTheDocument();
    expect(screen.getByText(education.university.name)).toBeInTheDocument();
    expect(screen.getByText(education.university.location!)).toBeInTheDocument();
    expect(screen.getByText(education.description!)).toBeInTheDocument();
  });

  it('renders skills section correctly', () => {
    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);

    const skillGroup = mockCVData.skills[0];
    expect(screen.getByText(skillGroup.name)).toBeInTheDocument();
    skillGroup.skills.forEach(skill => {
      expect(screen.getByText(skill.text)).toBeInTheDocument();
    });
  });

  it('handles close button click', async () => {
    const onCloseMock = vi.fn();
    const user = userEvent.setup();

    render(<CVModal isOpen={true} onClose={onCloseMock} cvData={mockCVData} />);

    const closeButton = screen.getByRole('button', { name: '×' });
    await user.click(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('handles download button click', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    // Define URL mock object
    const mockURL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    };
    // @ts-expect-error - mock URL global
    globalThis.URL = mockURL;

    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);

    const downloadButton = screen.getByRole('button', { name: /download cv/i });
    await user.click(downloadButton);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockURL.createObjectURL).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(mockURL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    // Clean up spies
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('handles download error', async () => {
    const user = userEvent.setup();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock URL to throw error
    const mockURL = {
      createObjectURL: vi.fn(() => {
        throw new Error('Mock download error');
      }),
    };
    // @ts-expect-error - mock URL global
    globalThis.URL = mockURL;

    render(<CVModal isOpen={true} onClose={() => {}} cvData={mockCVData} />);

    const downloadButton = screen.getByRole('button', { name: /download cv/i });
    await user.click(downloadButton);

    expect(consoleSpy).toHaveBeenCalledWith('Error downloading CV:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
