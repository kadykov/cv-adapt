import { http, HttpResponse } from 'msw'

// Store registered emails
const registeredEmails = new Set<string>()

const handlers = [
  // Register handler
  http.post('http://localhost:8000/v1/auth/register', async ({ request }) => {
    const { email } = await request.json() as { email: string }

    if (registeredEmails.has(email)) {
      return HttpResponse.json({
        detail: { message: 'Email already registered' }
      }, { status: 400 })
    }

    registeredEmails.add(email)
    return HttpResponse.json({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token'
    }, { status: 200 })
  }),

  // Login handler
  http.post('http://localhost:8000/v1/auth/login', async ({ request }) => {
    const formData = await request.text()
    const params = new URLSearchParams(formData)
    const password = params.get('password')

    if (password === 'wrongpassword') {
      return HttpResponse.json({
        detail: { message: 'Incorrect email or password' }
      }, { status: 401 })
    }

    return HttpResponse.json({
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token'
    }, { status: 200 })
  }),

  // Refresh token handler
  http.post('http://localhost:8000/v1/auth/refresh', async () => {
    return HttpResponse.json({
      access_token: 'new_mock_access_token'
    }, { status: 200 })
  })
]

export { handlers }
