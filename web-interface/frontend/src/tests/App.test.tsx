import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../components/App';
import { generateCV, generateCompetences } from '../api/cv';
import { mockCVData, mockCompetences } from './fixtures';

// Mock the CV generation API
vi.mock('../api/cv', () => ({
  generateCV: vi.fn(),
  generateCompetences: vi.fn()
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial form elements', () => {
    render(<App />);

    expect(screen.getByRole('textbox', { name: /cv text/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /job description/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate core competences/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generate cv/i })).not.toBeInTheDocument(); // CV button should not be visible initially
  });

  it('follows the complete workflow with competences and CV generation', async () => {
    const user = userEvent.setup();
    const mockGenerateCompetences = vi.mocked(generateCompetences);
    const mockGenerateCV = vi.mocked(generateCV);

    mockGenerateCompetences.mockResolvedValueOnce({ competences: mockCompetences });
    mockGenerateCV.mockResolvedValueOnce(mockCVData);

    render(<App />);

    // Step 1: Generate competences
    await user.type(screen.getByRole('textbox', { name: /cv text/i }), 'My CV content');
    await user.type(screen.getByRole('textbox', { name: /job description/i }), 'Job description content');

    const generateCompetencesButton = screen.getByRole('button', { name: /generate core competences/i });
    await user.click(generateCompetencesButton);

    // Verify competences were generated
    await waitFor(() => {
      expect(mockGenerateCompetences).toHaveBeenCalledWith({
        cv_text: 'My CV content',
        job_description: 'Job description content'
      }, 'en');
    });

    // Step 2: Fill personal info and select competences
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Select first competence
    const competenceCheckboxes = screen.getAllByRole('checkbox');
    await user.click(competenceCheckboxes[0]);

    // Step 3: Generate CV
    const generateCVButton = screen.getByRole('button', { name: /generate cv/i });
    await user.click(generateCVButton);

    expect(mockGenerateCV).toHaveBeenCalledWith({
      cv_text: 'My CV content',
      job_description: 'Job description content',
      personal_info: {
        full_name: 'John Doe',
        email: { value: 'john@example.com', type: 'email' },
        phone: { value: '', type: 'phone' },
        location: { value: '', type: 'location' }
      },
      approved_competences: [mockCompetences[0]]
    }, 'en');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Generated CV' })).toBeInTheDocument();
    });
  });

  it('handles API errors for both competence and CV generation', async () => {
    const user = userEvent.setup();
    const mockGenerateCompetences = vi.mocked(generateCompetences);
    mockGenerateCompetences.mockRejectedValueOnce(new Error('API Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);

    await user.type(screen.getByRole('textbox', { name: /cv text/i }), 'My CV content');
    await user.type(screen.getByRole('textbox', { name: /job description/i }), 'Job description content');

    const generateCompetencesButton = screen.getByRole('button', { name: /generate core competences/i });
    await user.click(generateCompetencesButton);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Error generating competences: API Error');
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    alertMock.mockRestore();
  });

  it('handles optional personal info fields correctly', async () => {
    const user = userEvent.setup();
    const mockGenerateCompetences = vi.mocked(generateCompetences);
    const mockGenerateCV = vi.mocked(generateCV);

    mockGenerateCompetences.mockResolvedValueOnce({ competences: mockCompetences });
    mockGenerateCV.mockResolvedValueOnce(mockCVData);

    render(<App />);

    // Generate competences first to show the personal info form
    await user.type(screen.getByRole('textbox', { name: /cv text/i }), 'My CV content');
    await user.type(screen.getByRole('textbox', { name: /job description/i }), 'Job description content');
    await user.click(screen.getByRole('button', { name: /generate core competences/i }));

    // Wait for personal info form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    // Fill required fields
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Fill optional fields
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/location/i), 'New York');

    // Select a competence
    const competenceCheckboxes = screen.getAllByRole('checkbox');
    await user.click(competenceCheckboxes[0]);

    // Generate CV
    const generateCVButton = screen.getByRole('button', { name: /generate cv/i });
    await user.click(generateCVButton);

    // Verify that optional fields are included in the CV generation request
    expect(mockGenerateCV).toHaveBeenCalledWith({
      cv_text: 'My CV content',
      job_description: 'Job description content',
      personal_info: {
        full_name: 'John Doe',
        email: { value: 'john@example.com', type: 'email' },
        phone: { value: '+1234567890', type: 'phone' },
        location: { value: 'New York', type: 'location' }
      },
      approved_competences: [mockCompetences[0]]
    }, 'en');
  });

  it('maintains optional field values after state updates', async () => {
    const user = userEvent.setup();
    const mockGenerateCompetences = vi.mocked(generateCompetences);
    mockGenerateCompetences.mockResolvedValueOnce({ competences: mockCompetences });

    render(<App />);

    // Generate competences first to show the personal info form
    await user.type(screen.getByRole('textbox', { name: /cv text/i }), 'My CV content');
    await user.type(screen.getByRole('textbox', { name: /job description/i }), 'Job description content');
    await user.click(screen.getByRole('button', { name: /generate core competences/i }));

    // Wait for personal info form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    // Fill optional fields first
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');
    await user.type(screen.getByLabelText(/location/i), 'New York');

    // Verify optional fields have correct values
    expect(screen.getByLabelText(/phone/i)).toHaveValue('+1234567890');
    expect(screen.getByLabelText(/location/i)).toHaveValue('New York');

    // Update required fields
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Verify optional fields maintained their values
    expect(screen.getByLabelText(/phone/i)).toHaveValue('+1234567890');
    expect(screen.getByLabelText(/location/i)).toHaveValue('New York');
  });

  it('validates personal info before CV generation', async () => {
    const user = userEvent.setup();
    const mockGenerateCompetences = vi.mocked(generateCompetences);
    mockGenerateCompetences.mockResolvedValueOnce({ competences: mockCompetences });

    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<App />);

    // Generate competences first
    await user.type(screen.getByRole('textbox', { name: /cv text/i }), 'My CV content');
    await user.type(screen.getByRole('textbox', { name: /job description/i }), 'Job description content');
    await user.click(screen.getByRole('button', { name: /generate core competences/i }));

    // Wait for personal info form to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    // Select a competence but don't fill personal info
    const competenceCheckboxes = screen.getAllByRole('checkbox');
    await user.click(competenceCheckboxes[0]);

    // Try to generate CV without personal info
    const generateCVButton = screen.getByRole('button', { name: /generate cv/i });
    await user.click(generateCVButton);

    expect(alertMock).toHaveBeenCalledWith('Please fill in required personal information (name and email)');

    alertMock.mockRestore();
  });
});
