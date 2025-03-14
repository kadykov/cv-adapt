# CV Generation Integration Plan

## Overview

This document outlines the integration plan for the CV generation feature with the authentication system, job positions, and Detailed CVs. The goal is to create a cohesive system that leverages existing features to provide a seamless user experience for CV generation.

## Current State

- CV generation functionality exists in `cv_adapter/core/async_application.py`
- All endpoints are now protected by authentication ✓
- Generated CVs are stored persistently ✓
- Integration with job positions and Detailed CVs completed ✓
- Language support implemented with proper context handling ✓

## Implementation Phases

### Phase 1: Backend Refactoring ✓

#### Storage Model Design ✓
- [x] Enhance `GeneratedCV` model (Decided against separate GeneratedCompetences model)
  - User reference ✓
  - Job position reference ✓
  - Detailed CV reference ✓
  - Generated CV data ✓
  - Status (draft, approved, rejected) ✓
  - Creation/update timestamps ✓
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
- [x] Generation Service Integration
  - Refactor generation services for stored entities ✓
  - Add persistence operations ✓
  - Implement error handling ✓
- [x] Create unified generation service interface
  - Define protocol/abstract base ✓
  - Standardize error types ✓
  - Add transaction support ✓
- [x] Implement CV repository pattern
  - CRUD operations ✓
  - Query optimizations ✓
  - Content handling strategy ✓

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

### Phase 2: API Integration ✓

#### Authentication Integration ✓
- [x] Protect generation endpoints
  - JWT validation ✓
  - Role-based access ✓
  - Rate limiting (planned for later)
- [x] Implement user context in requests
  - User identification ✓
  - Permission scoping ✓
  - Audit logging (planned for later)
- [x] Add permission verification
  - Resource ownership ✓
  - Action authorization ✓
  - Scope validation ✓

#### Essential Backend Features ✓
- [x] Add generation status checking endpoint
  - Check if generation is in progress ✓
  - Return error messages ✓
  - Support frontend polling ✓
  - Proper error handling ✓

#### Features for Later Releases
These features are not planned for the initial release:
- CV versioning and regeneration endpoints
- Complex status transitions
- Multi-language fallback system
- Rate limiting implementation
- Audit logging system

### Phase 3: Frontend Implementation

#### CV Generation Flow UI
- [ ] Create generation wizard
  - Step progression
  - Data validation
  - Progress indication
  - Generation status polling
- [ ] Implement job/CV selection
  - Filtering interface
  - Preview cards
  - Selection validation
- [ ] Design generation options screen
  - Parameter controls
  - Template selection
  - Notes input

#### Preview & Editing
- [ ] Create preview components
  - PDF preview
  - HTML preview
  - Print layout
- [ ] Implement competency review/editing
  - Inline editing
  - Batch updates
- [ ] Add full CV review/editing
  - Section organization
  - Content validation
  - Format controls

#### Document Management
- [ ] Implement CV listing
  - Grid/list views
  - Sort/filter controls
- [ ] Add status indicators
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

## Future Features and Considerations

The following features are planned for future releases:

### Version Control
- Multiple versions of CVs
- History tracking
- Diff views
- Rollback capabilities

### Enhanced Language Support
- Language fallback system
- Translation quality checks
- Priority rules for translations

### Audit and Security
- Rate limiting
- Detailed audit logging
- Enhanced approval workflows
