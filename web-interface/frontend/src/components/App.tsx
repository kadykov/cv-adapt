import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { generateCV, generateCompetences } from '../api/cv';
import type { CVDTO, PersonalInfo } from '../types/api';
import CVModal from './CVModal';

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cvData, setCvData] = useState<CVDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCompetences, setGeneratedCompetences] = useState<string[]>([]);
  const [selectedCompetences, setSelectedCompetences] = useState<string[]>([]);
  const [language, setLanguage] = useState('en');

  // Personal info state
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    full_name: '',
    email: { value: '', type: 'email' },
    phone: { value: '', type: 'phone' },
    location: { value: '', type: 'location' }
  });

  // Handle personal info changes
  const handlePersonalInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'full_name') {
      setPersonalInfo(prev => ({
        ...prev,
        full_name: value
      }));
    } else if (['email', 'phone', 'location'].includes(name)) {
      const field = name as 'email' | 'phone' | 'location';
      setPersonalInfo(prev => ({
        ...prev,
        [field]: {
          value: value,
          type: field
        }
      }));
    }
  };

  // Handle competence selection
  const handleCompetenceToggle = (competence: string) => {
    setSelectedCompetences(prev =>
      prev.includes(competence)
        ? prev.filter(c => c !== competence)
        : [...prev, competence]
    );
  };

  // Handle competences generation
  const handleGenerateCompetences = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cvText = formData.get('cvText') as string;
    const jobDescription = formData.get('jobDescription') as string;
    const notes = formData.get('notes') as string;

    if (!cvText || !jobDescription) {
      alert('Please fill in both CV text and job description');
      return;
    }

    try {
      setIsLoading(true);
      const competencesResult = await generateCompetences({
        cv_text: cvText,
        job_description: jobDescription,
        notes: notes || undefined
      }, language);

      setGeneratedCompetences(competencesResult.competences);
      setSelectedCompetences([]); // Reset selections when new competences are generated
    } catch (error) {
      console.error('Error generating competences:', error);
      if (error instanceof Error) {
        alert(`Error generating competences: ${error.message}`);
      } else {
        alert('An unknown error occurred while generating competences.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle CV generation with selected competences
  const handleGenerateCV = async () => {
    if (selectedCompetences.length === 0) {
      alert('Please select at least one competence');
      return;
    }

    if (!personalInfo.full_name || !personalInfo.email.value) {
      alert('Please fill in required personal information (name and email)');
      return;
    }

    const formElement = document.querySelector('form');
    if (!formElement) return;

    const formData = new FormData(formElement);
    const cvText = formData.get('cvText') as string;
    const jobDescription = formData.get('jobDescription') as string;
    const notes = formData.get('notes') as string;

    try {
      setIsLoading(true);
      const cv = await generateCV({
        cv_text: cvText,
        job_description: jobDescription,
        personal_info: personalInfo,
        approved_competences: selectedCompetences,
        notes: notes || undefined
      }, language);

      setCvData(cv);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error generating CV:', error);
      if (error instanceof Error) {
        alert(`Error generating CV: ${error.message}`);
      } else {
        alert('An unknown error occurred while generating the CV.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleGenerateCompetences} className="max-w-3xl mx-auto p-4">
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h3 className="card-title">Document Information</h3>
            <div className="form-control w-full">
              <label className="label" htmlFor="language">
                <span className="label-text">Language</span>
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="en">English</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label" htmlFor="cvText">
                <span className="label-text">CV Text</span>
              </label>
              <textarea
                id="cvText"
                name="cvText"
                placeholder="Paste your CV text here..."
                required
                className="textarea textarea-bordered min-h-[120px]"
              />
            </div>

            <div className="form-control w-full">
              <label className="label" htmlFor="jobDescription">
                <span className="label-text">Job Description</span>
              </label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                placeholder="Paste the job description here..."
                required
                className="textarea textarea-bordered min-h-[120px]"
              />
            </div>

            <div className="form-control w-full">
              <label className="label" htmlFor="notes">
                <span className="label-text">Additional Notes (Optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Any additional notes..."
                className="textarea textarea-bordered"
              />
            </div>

            <div className="form-control w-full mt-4">
              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Core Competences'}
              </button>
            </div>
          </div>
        </div>

        {generatedCompetences.length > 0 && (
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h3 className="card-title">Personal Information</h3>
              <div className="form-control w-full">
                <label className="label" htmlFor="full_name">
                  <span className="label-text">Full Name*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={personalInfo.full_name}
                  onChange={handlePersonalInfoChange}
                  required
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control w-full">
                <label className="label" htmlFor="email">
                  <span className="label-text">Email*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={personalInfo.email.value}
                  onChange={handlePersonalInfoChange}
                  required
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control w-full">
                <label className="label" htmlFor="phone">
                  <span className="label-text">Phone</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={personalInfo.phone?.value || ''}
                  onChange={handlePersonalInfoChange}
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control w-full">
                <label className="label" htmlFor="location">
                  <span className="label-text">Location</span>
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={personalInfo.location?.value || ''}
                  onChange={handlePersonalInfoChange}
                  className="input input-bordered w-full"
                />
              </div>

              <h3 className="card-title mt-6">Select Core Competences</h3>
              <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto bg-base-200">
                {generatedCompetences.map((competence, index) => (
                <div key={index} className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={selectedCompetences.includes(competence)}
                      onChange={() => handleCompetenceToggle(competence)}
                    />
                    <span className="label-text">{competence}</span>
                  </label>
                </div>
              ))}
            </div>

              <div className="form-control w-full mt-4">
                <button
                  type="button"
                  onClick={handleGenerateCV}
                  className="btn btn-primary w-full"
                  disabled={isLoading || selectedCompetences.length === 0}
                >
                  {isLoading ? 'Generating...' : 'Generate CV'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {cvData && (
        <CVModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cvData={cvData}
        />
      )}
    </div>
  );
}
