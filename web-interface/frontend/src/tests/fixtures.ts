import type { CVDTO } from '../types/api';

export const mockCompetences = [
  'Full Stack Development',
  'System Architecture',
  'Cloud Computing',
  'Team Leadership',
  'Agile Project Management'
];

export const mockCVData: CVDTO = {
  personal_info: {
    full_name: "John Doe",
    email: {
      value: "john@example.com",
      type: "email"
    },
    phone: {
      value: "+1234567890",
      type: "phone"
    },
    location: {
      value: "New York, NY",
      type: "location"
    }
  },
  title: {
    text: "Senior Software Engineer"
  },
  core_competences: [
    {
      text: "Full Stack Development"
    },
    {
      text: "System Architecture"
    }
  ],
  summary: {
    text: "Experienced software engineer with 8+ years of experience..."
  },
  experiences: [
    {
      position: "Senior Software Engineer",
      company: {
        name: "Tech Corp",
        location: "San Francisco, CA"
      },
      start_date: "2020-01",
      end_date: "2023-12",
      description: "Led development of cloud-native applications",
      technologies: ["React", "Node.js", "AWS"]
    }
  ],
  education: [
    {
      degree: "Master of Computer Science",
      university: {
        name: "Tech University",
        location: "Boston, MA"
      },
      start_date: "2016",
      end_date: "2018",
      description: "Focus on Distributed Systems"
    }
  ],
  skills: [
    {
      name: "Programming Languages",
      skills: [
        { text: "JavaScript" },
        { text: "TypeScript" },
        { text: "Python" }
      ]
    }
  ],
  language: {
    code: "en"
  },
  approved_competences: []
};
