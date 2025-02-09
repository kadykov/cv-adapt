import { http, HttpResponse, type HttpHandler } from 'msw'
import type { OpenAPISchema, Operation, Reference, Schema, PathItem } from '../../../src/tests/mocks/types'

type JsonPrimitive = string | number | boolean | null;
type JsonArray = Array<JsonPrimitive | JsonObject | JsonArray>;
interface JsonObject {
  [key: string]: JsonPrimitive | JsonObject | JsonArray;
}

type MockValue = JsonPrimitive | JsonObject | JsonArray;

const DEFAULT_OBJECT: JsonObject = { _type: 'object' };

// Import schema with a require to avoid TypeScript module resolution issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const schema = require('../../api/openapi.json') as OpenAPISchema

const isReference = (obj: unknown): obj is Reference => {
  return obj !== null && typeof obj === 'object' && '$ref' in obj
}

const resolveReference = (ref: string): Schema => {
  const path = ref.replace('#/', '').split('/')
  let resolved: unknown = schema
  for (const segment of path) {
    if (resolved && typeof resolved === 'object' && segment in resolved) {
      resolved = resolved[segment as keyof typeof resolved]
    } else {
      throw new Error(`Invalid reference path segment: ${segment}`)
    }
  }
  return resolved as Schema
}

const generateMockValue = (property: Schema | Reference, seen: Set<string>): MockValue => {
  if (isReference(property)) {
    const ref = property.$ref
    if (seen.has(ref)) {
      return DEFAULT_OBJECT
    }
    seen.add(ref)
    return generateMockData(resolveReference(ref), seen)
  }

  if (property.type === 'string') {
    if (property.format === 'email') return 'user@example.com'
    if (property.format === 'date-time') return new Date().toISOString()
    if (property.pattern === '^password$') return 'password'
    if (property.title?.toLowerCase().includes('token')) {
      return `mock_${property.title.toLowerCase()}`
    }
    return 'mock_string'
  }

  if (property.type === 'number' || property.type === 'integer') {
    return 0
  }

  if (property.type === 'boolean') {
    return true
  }

  if (property.type === 'array' && property.items) {
    const mockItem = generateMockValue(property.items, new Set([...seen]))
    return [mockItem]
  }

  return DEFAULT_OBJECT
}

const generateUserResponse = (): JsonObject => {
  return {
    id: 1,
    email: 'user@example.com',
    created_at: new Date().toISOString(),
    personal_info: null
  }
}

const generateAuthResponse = (): JsonObject => {
    const mockResponse = {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'user@example.com',
        created_at: new Date().toISOString(),
        personal_info: null
      }
    }
    console.error('\nGenerated Auth Response:', JSON.stringify(mockResponse, null, 2))
    return mockResponse

}

const generateMockData = (schema: Schema | Reference, seen = new Set<string>()): MockValue => {
  if (isReference(schema)) {
    const ref = schema.$ref
    if (ref === '#/components/schemas/AuthResponse') {
      return generateAuthResponse()
    }
    if (ref === '#/components/schemas/UserResponse') {
      return generateUserResponse()
    }

    const resolvedSchema = resolveReference(ref)
    if (!resolvedSchema.properties) {
      return generateMockValue(schema, seen)
    }
    schema = resolvedSchema
  }

  if (!schema.properties) {
    return DEFAULT_OBJECT
  }

  const result: JsonObject = {}

  // Handle required properties first
  const requiredProps = schema.required || []
  for (const key of requiredProps) {
    const prop = schema.properties[key]
    if (prop) {
      result[key] = generateMockValue(prop, new Set([...seen]))
    }
  }

  // Handle remaining properties
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!(key in result)) {
      result[key] = generateMockValue(prop, new Set([...seen]))
    }
  }

  return result
}

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head'

const generateHandler = (path: string, method: string, operation: Operation) => {
  // Ensure method is a valid HTTP method
  const httpMethod = method.toLowerCase() as HttpMethod
  if (!(httpMethod in http)) {
    throw new Error(`Unsupported HTTP method: ${method}`)
  }

  // For MSW, we need the full URL pattern
  const fullPath = path.startsWith('http') ? path : `*${path}`

  return http[httpMethod](fullPath, async () => {
    // Get success response schema
    const successResponse = operation.responses['200']
    if (!successResponse) {
      return new HttpResponse(null, { status: 204 })
    }

    const content = successResponse.content?.['application/json']
    if (!content) {
      return new HttpResponse(null, { status: 200 })
    }

    // Generate mock data based on schema
    const mockData = path.startsWith('/v1/auth/') ?
      generateAuthResponse() :
      generateMockData(content.schema)

    // Handle auth responses
    let response: JsonObject = mockData as JsonObject
    if (path.startsWith('/v1/auth/')) {
      if (path.includes('/refresh')) {
        response = {
          ...response,
          refresh_token: 'mock_refresh_token'  // Ensure refresh token is always present
        }
      }
    }

    // Debug logging
    console.error('\n=== Handler Response ===')
    console.error('Path:', path)
    console.error('Response:', JSON.stringify(response, null, 2))
    console.error('===========================\n')

    return HttpResponse.json(response, { status: 200 })
  })
}

export const generateHandlers = (): HttpHandler[] => {
  const handlers: HttpHandler[] = []

  Object.entries(schema.paths).forEach(([path, pathItem]) => {
    const item = pathItem as PathItem
    Object.entries(item).forEach(([method, op]) => {
      if (method === 'parameters' || typeof op !== 'object' || !op) return
      const operation = op as Operation
      handlers.push(generateHandler(path, method, operation))
    })
  })

  return handlers
}

export const handlers: HttpHandler[] = generateHandlers()
