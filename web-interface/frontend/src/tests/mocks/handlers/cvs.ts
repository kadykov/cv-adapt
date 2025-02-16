import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:8000/v1';

interface DetailedCV {
  id: number;
  user_id: number;
  language_code: string;
  content: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  is_primary: boolean;
}

interface GeneratedCV {
  id: number;
  user_id: number;
  language_code: string;
  content: Record<string, unknown>;
  created_at: string;
  detailed_cv_id: number;
  job_description_id: number;
}

const mockDetailedCVs: DetailedCV[] = [
  {
    id: 1,
    user_id: 1,
    language_code: 'en',
    content: { summary: 'Test summary' },
    created_at: new Date().toISOString(),
    is_primary: true
  }
];

const mockGeneratedCVs: GeneratedCV[] = [
  {
    id: 1,
    user_id: 1,
    language_code: 'en',
    content: { summary: 'Generated summary' },
    created_at: new Date().toISOString(),
    detailed_cv_id: 1,
    job_description_id: 1
  }
];

export const cvHandlers = [
  // Get all detailed CVs
  http.get(`${API_URL}/v1/api/user/detailed-cvs`, () => {
    return HttpResponse.json(mockDetailedCVs);
  }),

  // Get detailed CV by language
  http.get(`${API_URL}/v1/api/user/detailed-cvs/:language_code`, ({ params }) => {
    const cv = mockDetailedCVs.find(cv => cv.language_code === params.language_code);
    if (!cv) {
      return new HttpResponse(
        JSON.stringify({ message: 'CV not found' }),
        { status: 404 }
      );
    }
    return HttpResponse.json(cv);
  }),

  // Create/Update detailed CV
  http.put(`${API_URL}/v1/api/user/detailed-cvs/:language_code`, async ({ request, params }) => {
    const body = await request.json() as Omit<DetailedCV, 'id' | 'user_id' | 'created_at'>;
    const existingIndex = mockDetailedCVs.findIndex(cv => cv.language_code === params.language_code);

    const updatedCV: DetailedCV = {
      id: existingIndex >= 0 ? mockDetailedCVs[existingIndex].id : mockDetailedCVs.length + 1,
      user_id: 1,
      created_at: existingIndex >= 0 ? mockDetailedCVs[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...body
    };

    if (existingIndex >= 0) {
      mockDetailedCVs[existingIndex] = updatedCV;
    } else {
      mockDetailedCVs.push(updatedCV);
    }

    return HttpResponse.json(updatedCV);
  }),

  // Delete detailed CV
  http.delete(`${API_URL}/v1/api/user/detailed-cvs/:language_code`, ({ params }) => {
    const index = mockDetailedCVs.findIndex(cv => cv.language_code === params.language_code);
    if (index === -1) {
      return new HttpResponse(
        JSON.stringify({ message: 'CV not found' }),
        { status: 404 }
      );
    }

    mockDetailedCVs.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // Set CV as primary
  http.put(`${API_URL}/v1/api/user/detailed-cvs/:language_code/primary`, ({ params }) => {
    const cv = mockDetailedCVs.find(cv => cv.language_code === params.language_code);
    if (!cv) {
      return new HttpResponse(
        JSON.stringify({ message: 'CV not found' }),
        { status: 404 }
      );
    }

    // Set all CVs as non-primary
    mockDetailedCVs.forEach(cv => cv.is_primary = false);
    // Set selected CV as primary
    cv.is_primary = true;

    return HttpResponse.json(cv);
  }),

  // Generate CV
  http.post(`${API_URL}/generate`, async ({ request }) => {
    const body = await request.json() as Omit<GeneratedCV, 'id' | 'user_id' | 'created_at'>;
    const newCV: GeneratedCV = {
      id: mockGeneratedCVs.length + 1,
      user_id: 1,
      created_at: new Date().toISOString(),
      ...body
    };

    mockGeneratedCVs.push(newCV);
    return HttpResponse.json(newCV);
  }),

  // Get all generated CVs
  http.get(`${API_URL}/generations`, () => {
    return HttpResponse.json(mockGeneratedCVs);
  }),

  // Get specific generated CV
  http.get(`${API_URL}/generations/:cv_id`, ({ params }) => {
    const cv = mockGeneratedCVs.find(cv => cv.id === Number(params.cv_id));
    if (!cv) {
      return new HttpResponse(
        JSON.stringify({ message: 'Generated CV not found' }),
        { status: 404 }
      );
    }
    return HttpResponse.json(cv);
  }),

  // Generate competences
  http.post(`${API_URL}/api/generate-competences`, async () => {
    return HttpResponse.json({
      competences: [
        'Strong problem-solving skills',
        'Excellent communication',
        'Team leadership'
      ]
    });
  })
];
