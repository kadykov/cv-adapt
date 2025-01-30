import React from 'react';

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: any;
}

function CVModal({ isOpen, onClose, cvData }: CVModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(cvData, null, 2)], {
      type: 'application/json',
    });
    element.href = URL.createObjectURL(file);
    element.download = 'generated-cv.json';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Generated CV</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="cv-preview">
            <h3>Personal Information</h3>
            <p><strong>Name:</strong> {cvData.personal_info?.name}</p>
            <p><strong>Email:</strong> {cvData.personal_info?.email}</p>
            {cvData.personal_info?.phone && (
              <p><strong>Phone:</strong> {cvData.personal_info.phone}</p>
            )}
            {cvData.personal_info?.location && (
              <p><strong>Location:</strong> {cvData.personal_info.location}</p>
            )}

            <h3>Core Competences</h3>
            <ul>
              {cvData.core_competences?.map((competence: string, index: number) => (
                <li key={index}>{competence}</li>
              ))}
            </ul>

            {cvData.summary && (
              <>
                <h3>Summary</h3>
                <p>{cvData.summary}</p>
              </>
            )}

            {cvData.experiences && (
              <>
                <h3>Experience</h3>
                <div className="experiences">
                  {cvData.experiences.map((exp: any, index: number) => (
                    <div key={index} className="experience-item">
                      <h4>{exp.title}</h4>
                      <p>{exp.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="download-button" onClick={handleDownload}>
            Download CV
          </button>
          <button className="close-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CVModal;
