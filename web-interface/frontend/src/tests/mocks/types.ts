export interface OpenAPISchema {
  paths: {
    [path: string]: PathItem;
  };
  components: {
    schemas: {
      [name: string]: Schema;
    };
  };
}

export interface PathItem {
  [method: string]: Operation | unknown; // Allow for parameters and other fields
}

export interface Operation {
  responses: {
    [statusCode: string]: Response;
  };
  parameters?: Parameter[];
  requestBody?: RequestBody;
}

export interface Response {
  description: string;
  content?: {
    [mediaType: string]: {
      schema: Schema | Reference;
    };
  };
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: Schema | Reference;
}

export interface RequestBody {
  content: {
    [mediaType: string]: {
      schema: Schema | Reference;
    };
  };
  required?: boolean;
}

export interface Schema {
  type?: string;
  properties?: {
    [name: string]: Schema | Reference;
  };
  items?: Schema | Reference;
  required?: string[];
  example?: unknown;
  nullable?: boolean;
  format?: string;
  enum?: unknown[];
  description?: string;
  title?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface JsonSchema {
  type?: string | string[];
  properties?: {
    [key: string]: JsonSchema;
  };
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  description?: string;
  title?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface Reference {
  $ref: string;
}
