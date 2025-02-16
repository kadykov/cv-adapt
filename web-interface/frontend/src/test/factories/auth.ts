import { type components } from '../../types/api-schema';

type AuthResponse = components['schemas']['AuthResponse'];
import { faker } from '@faker-js/faker';

export const createMockAuthResponse = (override: Partial<AuthResponse> = {}): AuthResponse => ({
  access_token: faker.string.alpha({ length: 15 }),
  refresh_token: faker.string.alpha({ length: 20 }),
  token_type: 'bearer',
  expires_in: 3600, // 1 hour in seconds
  user: {
    id: faker.number.int(),
    email: faker.internet.email(),
    created_at: faker.date.recent().toISOString(),
    personal_info: {}
  },
  ...override
});
