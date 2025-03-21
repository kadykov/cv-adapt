# CV Sections Test Organization

This directory contains tests for CV section components:

## Structure

```
__tests__/
├── fixtures.ts         # Shared test data
├── utils.tsx          # Shared test utilities
├── unit/              # Unit tests
│   ├── CoreCompetences.test.tsx
│   ├── Education.test.tsx
│   ├── error-handling.test.tsx
│   ├── Experience.test.tsx
│   └── PersonalInfo.test.tsx
└── integration/       # Integration tests
    └── cv-sections-preview.integration.test.tsx
```

## Test Types

### Unit Tests

Component-level testing covering:

- Props and state management
- Event handlers
- Error states
- Proper HeadlessUI component usage:
  - ARIA attributes
  - Role expectations
  - Default behaviors

### Integration Tests

Cross-component testing covering:

- Component interactions
- User flows
- State synchronization
- Navigation patterns
- Complex HeadlessUI interactions

## Testing HeadlessUI Components

Since we use HeadlessUI, accessibility features are built into the components. Our tests verify proper component usage:

### Unit Test Level

```tsx
// Example: Testing a HeadlessUI Dialog
test('dialog has correct ARIA attributes', () => {
  render(<Component />);
  const dialog = screen.getByRole('dialog');

  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveAttribute('aria-labelledby');
});
```

### Integration Test Level

```tsx
// Example: Testing keyboard navigation
test('supports keyboard navigation', async () => {
  const user = userEvent.setup();
  render(<CVPreview />);

  await user.tab(); // Focus first element
  expect(screen.getByRole('button')).toHaveFocus();

  await user.keyboard('{Enter}'); // Activate control
  expect(screen.getByRole('dialog')).toBeVisible();
});
```

## Key Testing Areas

1. Component Behavior

   - State changes
   - Event handling
   - Error states

2. Accessibility (via HeadlessUI)

   - ARIA attributes
   - Keyboard navigation
   - Focus management
   - Screen reader support

3. Integration
   - Component composition
   - State synchronization
   - Cross-component interactions

## Utilities

- `fixtures.ts`: Mock data for testing
- `utils.tsx`: Test utilities and helpers

## Naming Convention

- Unit tests: `*.test.tsx`
- Integration tests: `*.integration.test.tsx`
