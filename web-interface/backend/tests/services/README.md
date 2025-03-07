# Service Layer Tests

## Test Organization

The service layer tests are organized into three main categories:

1. **Repository Tests** (`test_repositories.py`)
   - Tests database operations through repositories
   - Uses raw model data and handles string content
   - Focuses on CRUD operations and error cases
   - Handles proper SQLAlchemy column type conversion

2. **Generation Service Tests** (`test_generation_service.py`)
   - Tests CV generation business logic
   - Handles conversion between models and DTOs
   - Uses mocked adapter for generation operations
   - Tests proper error propagation and handling

3. **Test Fixtures** (`conftest.py`)
   - Provides shared test data and setup
   - Creates test models with realistic content
   - Handles database transactions

## Content Handling

Different parts of the system handle CV content differently:

### DetailedCV
- Content is stored as plain text/markdown
- User has full flexibility in content format
- Content is rendered as markdown in the frontend

Example content:
```markdown
# Software Engineer

## Experience
- Senior Developer at Tech Corp (2020-2023)
...
```

### GeneratedCV
- Database stores content as markdown
- Service layer uses structured DTOs for generation
- Content is rendered using cv_adapter's MarkdownRenderer for consistent formatting
- Frontend renders final content as markdown

Example content matches DetailedCV format for consistency.

## Testing Patterns

### Repository Tests
Test raw database operations with proper type handling:
```python
def test_save_generated_cv():
    cv_data = GeneratedCVCreate(
        detailed_cv_id=detailed_cv_id,  # Ensure int type
        job_description_id=job_id,      # Ensure int type
        content="# Test Content",       # Markdown content
        language_code="en"
    )
    cv = repository.save_generated_cv(user_id, cv_data)
    assert cv.content == "# Test Content"
```

### Service Tests
Test business logic, DTO handling, and error propagation:
```python
async def test_generate_cv():
    # Test generation with default en language
    result = await service.generate_cv(
        cv_text=cv_text,
        job_description=description,
        personal_info=personal_info,
        competences=competences,
        language=Language(code="en")
    )
    assert isinstance(result, CVDTO)

async def test_generate_cv_error():
    # Test raw error message propagation
    with pytest.raises(GenerationError) as exc:
        await service.generate_cv(...)
    assert str(exc.value) == "Test error"
```

### Mock Patterns
- Use `AsyncMock` for CV adapter
- Mock generation responses match expected DTOs
- Test both success and error cases
- Ensure proper error message propagation through layers
- Test markdown rendering integration

### Testing Considerations
1. **Content Handling**
   - Test markdown content preservation
   - Verify rendering consistency
   - Check language context handling

2. **Error Handling**
   - Test raw error propagation
   - Verify error categorization
   - Check error message clarity

3. **Type Safety**
   - Ensure proper SQLAlchemy column handling
   - Verify DTO type consistency
   - Test language context typing
