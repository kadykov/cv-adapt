# Language Handling

This module provides type-safe handling of language codes across the application, ensuring compatibility between our internal types and the API schema.

## Key Components

### Types (`types.ts`)

- `LanguageCode` enum: Our internal representation of supported languages
- Type-safe constants and utilities for language handling

### Adapters (`adapters.ts`)

Type-safe adapters for converting between our internal `LanguageCode` enum and the API's schema types:

```typescript
// Converting to API schema type
const apiLanguage = toApiLanguage(LanguageCode.ENGLISH); // 'en'

// Converting from API response
const localLanguage = fromApiLanguage('en'); // LanguageCode.ENGLISH
```

## Type Safety Strategy

1. **Internal Usage**

   - Use `LanguageCode` enum within the application
   - Compile-time checking of valid language codes
   - Clear, semantic usage with enum values

2. **API Boundaries**

   - Use adapters when sending/receiving data from the API
   - Runtime validation of language codes
   - Explicit error handling for invalid codes

3. **Validation**
   - `isValidLanguageCode` checks both runtime values and type compatibility
   - Error messages specifically indicate the source of validation failures

## Example Usage

```typescript
import { LanguageCode } from './types';
import { toApiLanguage, fromApiLanguage } from './adapters';

// Component props - use our enum
interface Props {
  language: LanguageCode;
}

// API call - convert to API type
function makeApiCall(language: LanguageCode) {
  const apiLanguage = toApiLanguage(language);
  return api.call({ language: apiLanguage });
}

// API response - convert to our enum
function handleResponse(data: ApiResponse) {
  const language = fromApiLanguage(data.language);
  // Now we can use it with type safety
}
```

## Best Practices

1. **Always Use the Enum Internally**

   ```typescript
   // Good
   const language = LanguageCode.ENGLISH;

   // Avoid
   const language = 'en';
   ```

2. **Use Adapters at API Boundaries**

   ```typescript
   // Good
   api.call({ language: toApiLanguage(language) });

   // Avoid
   api.call({ language: language as string });
   ```

3. **Handle Validation Errors**

   ```typescript
   try {
     const apiLanguage = toApiLanguage(userInput);
   } catch (error) {
     // Handle invalid language code
   }
   ```

4. **Document Type Conversions**
   ```typescript
   // Document when adapters are used
   function submitForm(data: FormData) {
     // Convert to API type before submission
     const apiLanguage = toApiLanguage(data.language);
     // ...
   }
   ```

## Testing

The adapters and types are thoroughly tested:

- Compilation tests ensure type safety
- Runtime tests verify validation
- Integration tests check API compatibility

See the tests in `__tests__/adapters.test.ts` for examples.
