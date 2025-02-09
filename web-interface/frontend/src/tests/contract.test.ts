import { describe, test, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './mocks/server'
import axios from 'axios'
import Ajv from 'ajv'
import type { OpenAPISchema, Operation, Schema, Reference, JsonSchema } from './mocks/types'

const ajv = new Ajv({
  strict: false, // OpenAPI can contain additional keywords
  allErrors: true
})
// eslint-disable-next-line @typescript-eslint/no-var-requires
const schema = require('../api/openapi.json') as OpenAPISchema

// Create axios instance for testing
const api = axios.create({
  baseURL: 'http://localhost:8000',
  validateStatus: () => true, // Don't throw on any status
})

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterAll(() => {
  server.close()
})

afterEach(() => {
  server.resetHandlers()
})

// Helper to convert OpenAPI schema to JSON Schema
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

const convertToJsonSchema = (schemaOrRef: Schema | Reference): JsonSchema => {
  // Handle references
  if ('$ref' in schemaOrRef) {
    const resolved = resolveReference(schemaOrRef.$ref)
    // Preserve required properties from referenced schema
    const converted = convertToJsonSchema(resolved)
    return {
      ...converted,
      title: resolved.title,
      required: resolved.required || []
    }
  }

  // Handle Schema object
  const {
    nullable,
    format,
    enum: enumValues,
    description,
    title,
    default: defaultValue,
    minimum,
    maximum,
    minLength,
    maxLength,
    pattern,
    ...rest
  } = schemaOrRef

  const jsonSchema: JsonSchema = {
    ...(format && { format }),
    ...(enumValues && { enum: enumValues }),
    ...(description && { description }),
    ...(title && { title }),
    ...(defaultValue !== undefined && { default: defaultValue }),
    ...(minimum !== undefined && { minimum }),
    ...(maximum !== undefined && { maximum }),
    ...(minLength !== undefined && { minLength }),
    ...(maxLength !== undefined && { maxLength }),
    ...(pattern && { pattern })
  }

  // Handle type
  if (rest.type) {
    jsonSchema.type = nullable ? [rest.type, 'null'] : rest.type
  }

  // Handle properties
  if (rest.properties) {
    jsonSchema.properties = {}
    for (const [key, prop] of Object.entries(rest.properties)) {
      jsonSchema.properties[key] = convertToJsonSchema(prop)
    }
  }

  // Handle array items
  if (rest.items) {
    jsonSchema.items = convertToJsonSchema(rest.items)
  }

  // Handle required fields
  if (rest.required) {
    jsonSchema.required = rest.required
  }

  return jsonSchema
}

// Helper to validate response against OpenAPI schema
const validateResponse = async (
  path: string,
  method: string,
  response: { status: number; data: unknown }
) => {
  const pathSpec = schema.paths[path]
  if (!pathSpec) {
    throw new Error(`Path ${path} not found in OpenAPI schema`)
  }

  const operation = pathSpec[method.toLowerCase()] as Operation | undefined
  if (!operation) {
    throw new Error(`Method ${method} not found for path ${path}`)
  }

  const responseSpec = operation.responses[response.status]
  if (!responseSpec) {
    throw new Error(
      `Status ${response.status} not documented for ${method} ${path}`
    )
  }

  // For now, we only validate 200 responses
  if (response.status === 200) {
    const content = responseSpec.content?.['application/json']
    if (!content) {
      throw new Error(`No JSON schema defined for ${method} ${path}`)
    }

    // Convert OpenAPI schema to JSON Schema
    const convertedSchema = convertToJsonSchema(content.schema)
    const jsonSchema = {
      ...convertedSchema,
      type: 'object'
    }

    // Compile and validate schema
    const validate = ajv.compile(jsonSchema)
    const valid = validate(response.data)

    if (!valid) {
      throw new Error(
        `Response validation failed for ${method} ${path}:\n` +
        ajv.errorsText(validate.errors)
      )
    }
  }
}

describe('Contract Tests', () => {
  // Test auth endpoints
  describe('Auth Endpoints', () => {
    test('POST /v1/auth/register matches OpenAPI spec', async () => {
    const response = await api.post('/v1/auth/register', {
      email: 'test@example.com',
      password: 'Password123!'
    })
    console.error('\nActual Response:', JSON.stringify(response.data, null, 2))
    await validateResponse('/v1/auth/register', 'post', response)
    })

    test('POST /v1/auth/login matches OpenAPI spec', async () => {
      const formData = new URLSearchParams()
      formData.append('username', 'test@example.com')
      formData.append('password', 'Password123!')
      formData.append('grant_type', 'password')

      const response = await api.post('/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      await validateResponse('/v1/auth/login', 'post', response)
    })

    test('POST /v1/auth/refresh matches OpenAPI spec', async () => {
    const response = await api.post('/v1/auth/refresh', {
      token: 'mock_refresh_token'
    })
    console.error('\nActual Response:', JSON.stringify(response.data, null, 2))
    await validateResponse('/v1/auth/refresh', 'post', response)
    })
  })

  // Add test blocks for other endpoint groups here
})
