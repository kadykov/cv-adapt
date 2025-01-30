# Web Interface Tutorial

The CV Adapter provides a web interface that allows users to interactively generate CVs through a user-friendly interface. This tutorial will guide you through using the web interface.

## Starting the Web Interface

1. Start the backend server:
```bash
cd web-interface/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

2. Start the frontend development server:
```bash
cd web-interface/frontend
npm install
npm start
```

The web interface will be available at `http://localhost:3000`.

## Using the Web Interface

### Step 1: Input Your Information
1. Paste your existing CV text into the "Your CV" text area
2. Paste the job description you're applying for into the "Job Description" text area
3. Click "Generate Core Competences"

### Step 2: Review and Select Competences
1. Review the AI-generated core competences
2. Select the competences you want to include in your CV using the checkboxes
3. Once you've selected at least one competence, you'll see the personal information form

### Step 3: Add Personal Information
1. Fill in your personal information:
   - Name (required)
   - Email (required)
   - Phone (optional)
   - Location (optional)

### Step 4: Generate Final CV
1. Click "Generate Final CV" to create your customized CV
2. Review the generated CV in the modal window
3. Use the "Download CV" button to save your CV

## Features

- Interactive competence selection
- Real-time validation
- Error handling and feedback
- Personal information management
- CV preview and download capabilities
- Responsive design for various screen sizes

## Technical Details

The web interface consists of two main components:

### Frontend (React)
- Built with React and TypeScript
- Uses modern React features (hooks, functional components)
- Styled with CSS modules
- Error handling and loading states
- Modal system for CV preview

### Backend (FastAPI)
- RESTful API endpoints
- CORS support for local development
- Integration with core CV Adapter functionality
- Error handling and validation
- Support for custom notes and configurations

## API Endpoints

### Generate Competences
```http
POST /api/generate-competences
Content-Type: application/json

{
  "cv_text": "string",
  "job_description": "string",
  "notes": "string (optional)"
}
```

### Generate CV
```http
POST /api/generate-cv
Content-Type: application/json

{
  "cv_text": "string",
  "job_description": "string",
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string (optional)",
    "location": "string (optional)"
  },
  "approved_competences": ["string"],
  "notes": "string (optional)"
}
```

## Error Handling

The web interface provides clear error messages for various scenarios:
- Network connectivity issues
- Invalid input data
- Server-side processing errors
- Missing required fields

## Customization

The web interface can be customized through:
- Environment variables for API endpoints
- CSS styling
- Component-level props
- Backend configuration options
