# CV Generation Integration Plan

## Overview

This document outlines the integration plan for the CV generation feature with the authentication system, job positions, and Detailed CVs. The goal is to create a cohesive system that leverages existing features to provide a seamless user experience for CV generation.

## Current State

- CV generation functionality exists in `cv_adapter/core/async_application.py`
- All endpoints are now protected by authentication ✓
- Generated CVs are stored persistently ✓
- Integration with job positions and Detailed CVs completed ✓
- Language support implemented with proper context handling ✓
- Type-safe datetime handling implemented ✓
- SQLAlchemy column type safety improvements added ✓

## Implementation Phases

### Phase 1: Backend Refactoring ✓

#### Storage Model Design ✓
- [x] Enhance `GeneratedCV` model (Decided against separate GeneratedCompetences model)
  - User reference ✓
  - Job position reference ✓
  - Detailed CV reference ✓
  - Generated CV data ✓
  - Status (draft, approved, rejected) ✓
  - Creation/update timestamps with UTC awareness ✓
  - Generation parameters used ✓
  - Version tracking ✓
- [x] Implement relationships with users, Detailed CVs, and job positions
  - Foreign key constraints ✓
  - Cascade rules ✓
  - Index optimizations ✓
- [x] Add versioning and status tracking
  - Version numbering system ✓
  - Status transitions (draft, approved, rejected) ✓
  - Field tracking via updated_at ✓

#### Service Layer Updates ✓
- [x] API Layer Updates
  - Create endpoints for status/parameter updates ✓
  - Add PATCH endpoint for modifications ✓
  - Implement proper error handling ✓
  - Add type-safe request handling ✓
- [x] Generation Service Integration
  - Refactor generation services for stored entities ✓
  - Add persistence operations ✓
  - Implement error handling ✓
  - Add type safety improvements ✓
- [x] Create unified generation service interface
  - Define protocol/abstract base ✓
  - Standardize error types ✓
  - Add transaction support ✓
  - Implement type-safe interfaces ✓
- [x] Implement CV repository pattern
  - CRUD operations ✓
  - Query optimizations ✓
  - Content handling strategy ✓
  - Type-safe datetime operations ✓
  - SQLAlchemy column type handling ✓

#### Generation Pipeline Refactoring ✓
- [x] Update async workflow for model integration
  - State management ✓
  - Progress tracking ✓
  - Event notifications ✓
- [x] Improve error handling
  - Error categorization ✓
  - Recovery strategies ✓
  - User feedback ✓
- [x] Add job-specific adaptation
  - Requirement matching ✓
  - Content adaptation ✓
  - Custom rules ✓
- [x] Implement language-aware generation
  - Context preservation ✓
  - Language handling ✓
  - Format localization ✓

### Phase 2: API Integration

#### Authentication Integration ✓
- [x] Protect generation endpoints
  - JWT validation ✓
  - Role-based access ✓
  - Rate limiting (future enhancement)
- [x] Implement user context in requests
  - User identification ✓
  - Permission scoping ✓
  - Audit logging (future enhancement)
- [x] Add permission verification
  - Resource ownership ✓
  - Action authorization ✓
  - Scope validation ✓

#### Endpoint Refactoring (Current Focus)

##### Error Categorization & Consistent Responses ✓
- [x] Create standardized error response structure
  - Define error response schema in `app/schemas/common.py` ✓
  - Create error utility functions in `app/core/errors.py` ✓
  - Update exception handlers in FastAPI app configuration ✓
  - Refactor existing endpoints to use new error utilities ✓
  - Add tests for error scenarios ✓
  - Add protection against sensitive information exposure ✓

##### Enhanced Filtered Listing ✓
- [x] Extend filtering capabilities
  - Update `GeneratedCVFilters` model in `app/schemas/common.py` ✓
  - Add job description filtering ✓
  - Support multiple status filtering ✓
  - Improve date range filtering ✓
  - Enhance repository query builder ✓
  - Add tests for new filtering options ✓
  - Add content search capability ✓

##### Regeneration Support ✓
- [x] Create regeneration endpoint
  - Add POST endpoint for regenerating existing CVs ✓
  - Support parameter modifications during regeneration ✓
  - Implement basic history tracking with based_on_id ✓
  - Add validation for regeneration parameters ✓
  - Write comprehensive tests ✓
  - Support section preservation during regeneration ✓

##### Status Management
- [ ] Implement status transition rules
  - Define allowed transitions (draft → approved/rejected)
  - Add validation in service layer
  - Improve error messages for invalid transitions
  - Add status transition tests

##### Export Enhancements
- [ ] Improve export functionality
  - Add error handling for rendering failures
  - Ensure consistent error responses
  - Enhance filename generation with metadata
  - Add tests for export edge cases

#### Multi-language Support (Future Enhancement)
- Preserve language context
- Language selection logic improvements
- Language fallback support
[To be detailed in future updates]

### Phase 3: Frontend Implementation (Future Enhancement)
#### CV Generation Flow UI ⬜
- [ ] Create generation wizard
  - Step progression
  - Data validation
  - Progress indication
- [ ] Implement job/CV selection
  - Filtering interface
  - Preview cards
  - Selection validation
- [ ] Design generation options screen
  - Parameter controls
  - Template selection
  - Notes input

#### Preview & Editing ⬜
- [ ] Create preview components
  - PDF preview
  - HTML preview
  - Print layout
- [ ] Implement competency review/editing
  - Inline editing
  - Batch updates
  - History tracking
- [ ] Add full CV review/editing
  - Section organization
  - Content validation
  - Format controls
- [ ] Design version comparison
  - Side-by-side view
  - Diff highlighting
  - Merge controls

#### Document Management ⬜
- [ ] Implement CV listing
  - Grid/list views
  - Sort/filter controls
  - Bulk actions
- [ ] Add status indicators and filtering
  - Visual status badges
  - Filter controls
  - Quick actions
- [ ] Create export interface
  - Format selection
  - Options configuration
  - Progress tracking
- [ ] Build PDF preview/download
  - Preview rendering
  - Download handling
  - Format options

## Decisions and Considerations

### Regeneration Strategy
- Simple regeneration creating new entries
- Basic link to original CV for reference
- No complex versioning in initial implementation
- Possibility for future versioning enhancements

### Status Transitions
- Simple validation rules for status changes
- Current allowed transitions: draft → approved/rejected
- Validation at service layer
- Potential for future workflow enhancements

### Error Handling
- Standardized error response format
- Consistent HTTP status codes
- Enhanced validation with helpful messages
- Type-safe datetime operations ✓
- SQLAlchemy column type safety ✓
