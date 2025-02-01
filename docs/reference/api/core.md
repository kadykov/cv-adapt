# Core API Reference

This section documents the core components of CV Adapt, including the main application classes and their configuration options.

## Synchronous API

### CVAdapterApplication

The standard synchronous application class for basic CV generation.

::: cv_adapter.core.application.CVAdapterApplication
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2

## Asynchronous API

### AsyncCVAdapterApplication

The asynchronous application class that provides both single-step and two-step CV generation workflows.

::: cv_adapter.core.async_application.AsyncCVAdapterApplication
    options:
        show_root_heading: true
        show_source: true
        heading_level: 3

## Core Interfaces

::: cv_adapter.core
    options:
        show_root_heading: false
        show_source: true
        heading_level: 2
        members: true
        show_if_no_docstring: true
