import { setupServer } from 'msw/node'
import { handlers } from './generate-handlers'

// Debug registered handlers
console.error('\nRegistered Handlers:', handlers.map(h => h.info.path))

export const server = setupServer(...handlers)
