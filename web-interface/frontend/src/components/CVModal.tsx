import React from 'react';
import type { CVDTO, ExperienceDTO, EducationDTO, SkillGroupDTO, CoreCompetenceDTO } from '../types/api';

interface CVModalProps {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVDTO;
}

const renderExperience = (exp: ExperienceDTO) => (
  <div className="card bg-base-100 shadow-sm">
    <div className="card-body">
      <h4 className="card-title text-lg">{exp.position}</h4>
      <p className="font-medium">{exp.company.name}</p>
      <p className="text-sm opacity-75">
        {exp.start_date}
        {exp.end_date ? ` - ${exp.end_date}` : ' - Present'}
      </p>
      {exp.company.location && (
        <p className="text-sm">{exp.company.location}</p>
      )}
      {exp.description && <p className="mt-2">{exp.description}</p>}
      {exp.technologies && exp.technologies.length > 0 && (
        <div className="mt-2">
          <p className="font-medium mb-1">Technologies:</p>
          <div className="flex flex-wrap gap-2">
            {exp.technologies.map((tech: string, i: number) => (
              <span key={i} className="badge badge-outline">{tech}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const renderEducation = (edu: EducationDTO) => (
  <div className="card bg-base-100 shadow-sm">
    <div className="card-body">
      <h4 className="card-title text-lg">{edu.degree}</h4>
      <p className="font-medium">{edu.university.name}</p>
      <p className="text-sm opacity-75">
        {edu.start_date}
        {edu.end_date ? ` - ${edu.end_date}` : ' - Present'}
      </p>
      {edu.university.location && (
        <p className="text-sm">{edu.university.location}</p>
      )}
      {edu.description && <p className="mt-2">{edu.description}</p>}
    </div>
  </div>
);

const renderSkillGroup = (group: SkillGroupDTO) => (
  <div className="card bg-base-100 shadow-sm">
    <div className="card-body">
      <h4 className="card-title text-lg">{group.name}</h4>
      <div className="flex flex-wrap gap-2">
        {group.skills.map((skill, i: number) => (
          <span key={i} className="badge badge-primary">{skill.text}</span>
        ))}
      </div>
    </div>
  </div>
);

const renderCoreCompetences = (competences: CoreCompetenceDTO[]) => (
  <div className="flex flex-wrap gap-2">
    {competences.map((competence, index: number) => (
      <span key={index} className="badge badge-lg">{competence.text}</span>
    ))}
  </div>
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
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Generated CV</h2>
          <button className="btn btn-sm btn-circle" onClick={onClose}>✕</button>
        </div>
        <div className="overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold mb-2">Personal Information</h3>
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

            <h3 className="text-xl font-semibold mt-6 mb-2">Title</h3>
            <p>{cvData.title.text}</p>

            <h3 className="text-xl font-semibold mt-6 mb-2">Core Competences</h3>
            {renderCoreCompetences(cvData.core_competences)}

            {cvData.summary && (
              <>
                <h3 className="text-xl font-semibold mt-6 mb-2">Summary</h3>
                <p>{cvData.summary.text}</p>
              </>
            )}

            <h3 className="text-xl font-semibold mt-6 mb-2">Experience</h3>
            <div className="space-y-4">
              {cvData.experiences.map((exp: ExperienceDTO, index: number) => (
                <div key={index}>
                  {renderExperience(exp)}
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-2">Education</h3>
            <div className="space-y-4">
              {cvData.education.map((edu: EducationDTO, index: number) => (
                <div key={index}>
                  {renderEducation(edu)}
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold mt-6 mb-2">Skills</h3>
            <div className="space-y-4">
              {cvData.skills.map((group: SkillGroupDTO, index: number) => (
                <div key={index}>
                  {renderSkillGroup(group)}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-action">
          <button className="btn btn-primary" onClick={handleDownload}>
            Download CV
          </button>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default CVModal;
