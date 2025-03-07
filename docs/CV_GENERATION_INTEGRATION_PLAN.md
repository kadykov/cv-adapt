# CV Generation Integration Plan

## Overview

This document outlines the integration plan for the CV generation feature with the authentication system, job positions, and Detailed CVs. The goal is to create a cohesive system that leverages existing features to provide a seamless user experience for CV generation.

## Current State

- CV generation functionality exists in `cv_adapter/core/async_application.py`
- Endpoints aren't protected by authentication
- Generated CVs aren't stored persistently
- No integration with job positions and Detailed CVs
- Lacks proper multilingual support

## Implementation Phases

### Phase 1: Backend Refactoring ⬜

#### Storage Model Design ✓
- [x] Enhance `GeneratedCV` model (Decided against separate GeneratedCompetences model)
  - User reference
  - Job position reference
  - Detailed CV reference
  - Generated CV data
  - Status (draft, approved, rejected)
  - Creation/update timestamps
  - Generation parameters used
  - Version tracking
- [x] Implement relationships with users, Detailed CVs, and job positions
  - Foreign key constraints ✓
  - Cascade rules ✓
  - Index optimizations ✓
- [x] Add versioning and status tracking
  - Version numbering system ✓
  - Status transitions (draft, approved, rejected) ✓
  - Field tracking via updated_at ✓

#### Service Layer Updates ⬜
- [x] API Layer Updates
  - Create endpoints for status/parameter updates ✓
  - Add PATCH endpoint for modifications ✓
  - Implement proper error handling ✓
- [ ] Generation Service Integration
  - Refactor generation services for stored entities
  - Add persistence operations
  - Implement error handling
- [ ] Create unified generation service interface
  - Define protocol/abstract base
  - Standardize error types
  - Add transaction support
- [ ] Implement CV repository pattern
  - CRUD operations
  - Query optimizations
  - Caching strategy

#### Generation Pipeline Refactoring ⬜
- [ ] Update async workflow for model integration
  - State management
  - Progress tracking
  - Event notifications
- [ ] Improve error handling
  - Error categorization
  - Recovery strategies
  - User feedback
- [ ] Add job-specific adaptation
  - Requirement matching
  - Priority ranking
  - Custom rules
- [ ] Implement language-aware generation
  - Context preservation
  - Translation coordination
  - Format localization

### Phase 2: API Integration ⬜

#### Authentication Integration ⬜
- [ ] Protect generation endpoints
  - JWT validation
  - Role-based access
  - Rate limiting
- [ ] Implement user context in requests
  - User identification
  - Permission scoping
  - Audit logging
- [ ] Add permission verification
  - Resource ownership
  - Action authorization
  - Scope validation

#### Endpoint Refactoring ⬜
- [ ] Update endpoints to use stored data
  - Query optimization
  - Response formatting
  - Error handling
- [ ] Create endpoints for full generation lifecycle
  - Initiate generation
  - Check status
  - Retrieve results
  - Update/regenerate
- [ ] Implement versioning endpoints
  - Version creation
  - History retrieval
  - Diff generation
- [ ] Add export endpoints
  - Format selection
  - Download handling
  - Async generation

#### Multi-language Support ⬜
- [ ] Preserve language context
  - Context propagation
  - Metadata handling
  - Format adaptation
- [ ] Implement language selection logic
  - Matching algorithm
  - Fallback rules
  - Priority handling
- [ ] Support language fallback
  - Default selection
  - Content mapping
  - Quality indicators

### Phase 3: Frontend Implementation ⬜

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

### Versioning Strategy
- To be discussed:
  - Version numbering scheme
  - Storage efficiency
  - Diff generation
  - Rollback capability

### Approval Workflow
- To be discussed:
  - Approval roles
  - State transitions
  - Notification system
  - Review process

### Regeneration Approach
- To be discussed:
  - Section vs full regeneration
  - Content preservation
  - Change tracking
  - Merge strategy

### Language Matching
- To be discussed:
  - Match priority rules
  - Fallback cascade
  - Quality thresholds
  - Translation handling

## Progress Tracking

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| Phase 1 | Not Started | | | Planning stage |
| Phase 2 | Not Started | | | Depends on Phase 1 |
| Phase 3 | Not Started | | | Depends on Phase 2 |
