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
            <p><strong>Name:</strong> {cvData.personal_info?.full_name}</p>
            <p><strong>Email:</strong> {cvData.personal_info?.email?.value}</p>
            {cvData.personal_info?.phone && (
              <p><strong>Phone:</strong> {cvData.personal_info.phone.value}</p>
            )}
            {cvData.personal_info?.location && (
              <p><strong>Location:</strong> {cvData.personal_info.location.value}</p>
            )}

            <h3>Title</h3>
            <p>{cvData.title?.text}</p>

            <h3>Core Competences</h3>
            <ul>
              {cvData.core_competences?.map((competence: any, index: number) => (
                <li key={index}>{competence.text}</li>
              ))}
            </ul>

            {cvData.summary && (
              <>
                <h3>Summary</h3>
                <p>{cvData.summary.text}</p>
              </>
            )}

            {cvData.experiences && (
              <>
                <h3>Experience</h3>
                <div className="experiences">
                  {cvData.experiences.map((exp: any, index: number) => (
                    <div key={index} className="experience-item">
                      <h4>{exp.title}</h4>
                      <p>{exp.role}</p>
                      <p>{exp.company}</p>
                      <p>{exp.period}</p>
                      {exp.achievements?.map((achievement: string, i: number) => (
                        <p key={i}>{achievement}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}

            {cvData.education && (
              <>
                <h3>Education</h3>
                <div className="education">
                  {cvData.education.map((edu: any, index: number) => (
                    <div key={index} className="education-item">
                      <h4>{edu.degree}</h4>
                      <p>{edu.institution}</p>
                      <p>{edu.period}</p>
                      <p>{edu.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {cvData.skills && (
              <>
                <h3>Skills</h3>
                <div className="skills">
                  {Object.entries(cvData.skills).map(([category, skills]: [string, any], index: number) => (
                    <div key={index} className="skill-category">
                      <h4>{category}</h4>
                      <ul>
                        {Array.isArray(skills) && skills.map((skill: string, i: number) => (
                          <li key={i}>{skill}</li>
                        ))}
                      </ul>
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
