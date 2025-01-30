import React, { useState } from 'react';
import CVModal from './components/CVModal';

function App() {
  const [cvText, setCvText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [competences, setCompetences] = useState<any[]>([]);
  const [approvedCompetences, setApprovedCompetences] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingCV, setIsGeneratingCV] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCV, setGeneratedCV] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });

  const handleGenerateCompetences = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/generate-competences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_text: cvText,
          job_description: jobDescription,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate competences');
      }
      const data = await response.json();
      if (data.competences) {
        setCompetences(Array.isArray(data.competences) ? data.competences : []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating competences:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setCompetences([]);
    }
    setIsGenerating(false);
  };

  const handleGenerateCV = async () => {
    setIsGeneratingCV(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/generate-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_text: cvText,
          job_description: jobDescription,
          personal_info: personalInfo,
          approved_competences: approvedCompetences,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate CV');
      }
      const data = await response.json();
      setGeneratedCV(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error generating CV:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
    setIsGeneratingCV(false);
  };

  return (
    <div className="App">
      <header>
        <h1>CV Adapter</h1>
      </header>
      <main>
        <div className="input-section">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <div className="input-group">
            <label htmlFor="cv-text">Your CV</label>
            <textarea
              id="cv-text"
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV text here..."
            />
          </div>
          <div className="input-group">
            <label htmlFor="job-description">Job Description</label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </div>
          <button
            onClick={handleGenerateCompetences}
            disabled={isGenerating || !cvText || !jobDescription}
          >
            {isGenerating ? 'Generating...' : 'Generate Core Competences'}
          </button>
        </div>
        {competences.length > 0 && (
          <div className="competences-section">
            <h2>Generated Core Competences</h2>
            <p className="help-text">Select the competences you want to include in your CV:</p>
            <ul className="competences-list">
              {competences.map((competence, index) => (
                <li key={index} className="competence-item">
                  <label className="competence-label">
                    <input
                      type="checkbox"
                      checked={approvedCompetences.includes(competence)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setApprovedCompetences([...approvedCompetences, competence]);
                        } else {
                          setApprovedCompetences(approvedCompetences.filter(c => c !== competence));
                        }
                      }}
                    />
                    <span>{competence}</span>
                  </label>
                </li>
              ))}
            </ul>
            {approvedCompetences.length > 0 && (
              <div className="personal-info-section">
                <h3>Personal Information</h3>
                <div className="personal-info-form">
                  <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                      type="text"
                      id="name"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo({...personalInfo, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone (optional)</label>
                    <input
                      type="tel"
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Location (optional)</label>
                    <input
                      type="text"
                      id="location"
                      value={personalInfo.location}
                      onChange={(e) => setPersonalInfo({...personalInfo, location: e.target.value})}
                    />
                  </div>
                </div>
                <button
                  className="generate-cv-button"
                  onClick={handleGenerateCV}
                  disabled={isGeneratingCV || !personalInfo.name || !personalInfo.email}
                >
                  {isGeneratingCV ? 'Generating CV...' : 'Generate Final CV'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      {generatedCV && (
        <CVModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          cvData={generatedCV}
        />
      )}
    </div>
  );
}

export default App;
