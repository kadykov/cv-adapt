import React from 'react';
import { CVDTO, ExperienceDTO, EducationDTO, SkillGroupDTO, CoreCompetenceDTO } from '../types/api';

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVDTO;
}

const renderExperience = (exp: ExperienceDTO) => (
  <div className="experience-item">
    <h4>{exp.position}</h4>
    <p><strong>Company:</strong> {exp.company.name}</p>
    <p>
      <strong>Period:</strong> {exp.start_date}
      {exp.end_date ? ` - ${exp.end_date}` : ' - Present'}
    </p>
    {exp.company.location && (
      <p><strong>Location:</strong> {exp.company.location}</p>
    )}
    {exp.description && <p>{exp.description}</p>}
    {exp.technologies && exp.technologies.length > 0 && (
      <>
        <strong>Technologies:</strong>
        <ul>
          {exp.technologies.map((tech, i) => (
            <li key={i}>{tech}</li>
          ))}
        </ul>
      </>
    )}
  </div>
);

const renderEducation = (edu: EducationDTO) => (
  <div className="education-item">
    <h4>{edu.degree}</h4>
    <p><strong>Institution:</strong> {edu.university.name}</p>
    <p>
      <strong>Period:</strong> {edu.start_date}
      {edu.end_date ? ` - ${edu.end_date}` : ' - Present'}
    </p>
    {edu.university.location && (
      <p><strong>Location:</strong> {edu.university.location}</p>
    )}
    {edu.description && <p>{edu.description}</p>}
  </div>
);

const renderSkillGroup = (group: SkillGroupDTO) => (
  <div className="skill-category">
    <h4>{group.name}</h4>
    <ul>
      {group.skills.map((skill, i) => (
        <li key={i}>{skill.text}</li>
      ))}
    </ul>
  </div>
);

const renderCoreCompetences = (competences: CoreCompetenceDTO[]) => (
  <ul>
    {competences.map((competence, index) => (
      <li key={index}>{competence.text}</li>
    ))}
  </ul>
);

function CVModal({ isOpen, onClose, cvData }: CVModalProps) {
  if (!isOpen) return null;

  const handleDownload = () => {
    try {
      const element = document.createElement('a');
      const file = new Blob([JSON.stringify(cvData, null, 2)], {
        type: 'application/json',
      });
      element.href = URL.createObjectURL(file);
      element.download = 'generated-cv.json';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href); // Clean up the URL object
    } catch (error) {
      console.error('Error downloading CV:', error);
      // You might want to add proper error handling UI here
    }
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
            <p><strong>Name:</strong> {cvData.personal_info.full_name}</p>
            {cvData.personal_info.email && (
              <p><strong>Email:</strong> {cvData.personal_info.email.value}</p>
            )}
            {cvData.personal_info.phone && (
              <p><strong>Phone:</strong> {cvData.personal_info.phone.value}</p>
            )}
            {cvData.personal_info.location && (
              <p><strong>Location:</strong> {cvData.personal_info.location.value}</p>
            )}
            {cvData.personal_info.linkedin && (
              <p><strong>LinkedIn:</strong> {cvData.personal_info.linkedin.value}</p>
            )}
            {cvData.personal_info.github && (
              <p><strong>GitHub:</strong> {cvData.personal_info.github.value}</p>
            )}

            <h3>Title</h3>
            <p>{cvData.title.text}</p>

            <h3>Core Competences</h3>
            {renderCoreCompetences(cvData.core_competences)}

            {cvData.summary && (
              <>
                <h3>Summary</h3>
                <p>{cvData.summary.text}</p>
              </>
            )}

            <h3>Experience</h3>
            <div className="experiences">
              {cvData.experiences.map((exp, index) => (
                <div key={index}>
                  {renderExperience(exp)}
                </div>
              ))}
            </div>

            <h3>Education</h3>
            <div className="education">
              {cvData.education.map((edu, index) => (
                <div key={index}>
                  {renderEducation(edu)}
                </div>
              ))}
            </div>

            <h3>Skills</h3>
            <div className="skills">
              {cvData.skills.map((group, index) => (
                <div key={index}>
                  {renderSkillGroup(group)}
                </div>
              ))}
            </div>
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
