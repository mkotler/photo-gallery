# HomeGallery - Code Summary

This document provides a comprehensive overview of the HomeGallery repository structure and explains the purpose and functionality of each folder and key file.

## Repository Overview

HomeGallery is a self-hosted open-source web gallery application for browsing personal photos and videos with AI-powered features like face detection, object recognition, and similarity search. It's built as a monorepo using pnpm workspaces with modular packages.

## Root Directory

### Key Files

- **`gallery.js`** - Main CLI entry point that imports and runs the CLI module from `@home-gallery/cli`
- **`package.json`** - Root package configuration defining workspaces, scripts, and dependencies for the monorepo
- **`README.md`** - Project documentation with installation, setup, and usage instructions
- **`gallery.config-example.yml`** - Example configuration file showing available settings
- **`docker-compose.yml`** - Docker composition for running the application with all services
- **`Dockerfile`** - Container definition for building the application image
- **`bundle.yml` / `bundle-docker.yml`** - Bundle configurations for packaging the application
- **`bundle-entry.js`** - Entry point for bundled application
- **`pnpm-workspace.yaml`** - Workspace configuration for the monorepo
- **`tsconfig.base.json`** - Base TypeScript configuration shared across packages

## Packages Directory (`packages/`)

The application is organized into modular packages, each serving a specific purpose:

### Core Infrastructure

#### `cli/` - Command Line Interface
- **Purpose**: Provides all CLI commands for HomeGallery operations
- **Key Functions**: 
  - Entry point for `extract`, `run`, `server`, `database`, etc. commands
  - Configuration management and validation
  - Orchestrates other packages based on CLI commands
- **Main Files**:
  - `src/index.js` - Main CLI router
  - `src/extractor.js` - Extract command implementation
  - `src/server.js` - Server command implementation
  - `src/database.js` - Database operations
  - `src/config/` - Configuration loading and validation

#### `common/` - Shared Utilities
- **Purpose**: Common utilities and helper functions used across packages
- **Key Functions**: File operations, logging helpers, process management

#### `logger/` - Logging System
- **Purpose**: Centralized logging functionality
- **Key Functions**: Structured logging with different levels and formatters

#### `types/` - TypeScript Definitions
- **Purpose**: Shared TypeScript type definitions
- **Key Functions**: Provides type safety across the entire application

### Data Processing

#### `extractor/` - Media Processing Engine
- **Purpose**: Extracts metadata, creates previews, and processes media files
- **Key Functions**:
  - Image/video preview generation (thumbnails, various sizes)
  - EXIF metadata extraction using exiftool
  - Video metadata extraction using ffprobe
  - AI-powered features (face detection, object recognition, similarity embeddings)
  - Geographic reverse lookups for GPS coordinates
- **Main Components**:
  - `src/extract/image/` - Image processing plugins
  - `src/extract/meta/` - Metadata extraction
  - `src/extract/image/api-server.js` - AI features integration

#### `database/` - Database Management
- **Purpose**: Manages the application's JSON-based database
- **Key Functions**:
  - Database creation and updates
  - Entry merging and deduplication
  - Plugin system integration for data mapping
- **Main Files**:
  - `src/build.js` - Database building logic
  - `src/database/` - Core database operations

#### `index/` - File Indexing
- **Purpose**: Scans directories and creates file indexes
- **Key Functions**:
  - Recursive directory scanning
  - File filtering and exclusion patterns
  - Change detection and incremental updates

### Web Application

#### `webapp/` - Frontend React Application
- **Purpose**: Main web interface for browsing photos and videos
- **Key Functions**:
  - Gallery browsing with various view modes
  - Search and filtering capabilities
  - Map view for geotagged photos
  - Tag management and organization
  - PWA (Progressive Web App) support
- **Main Components**:
  - `src/list/` - Gallery list views
  - `src/single/` - Single photo/video viewer
  - `src/map/` - Map-based photo browsing
  - `src/search/` - Search functionality
  - `src/tags/` - Tag management

#### `server/` - Web Server
- **Purpose**: Serves the web application and provides REST API
- **Key Functions**:
  - Static file serving for photos/videos
  - REST API for database queries
  - WebSocket events for real-time updates
  - Authentication and authorization
  - Plugin system integration
- **API Endpoints**:
  - `/api/database.json` - Main database endpoint
  - `/api/events.json` - User events and changes
  - `/api/database/tree/` - Hierarchical data structure
  - `/files/` - Static media file serving

### AI and External Services

#### `api-server/` - AI Processing Server
- **Purpose**: Standalone server providing AI-powered image analysis
- **Key Functions**:
  - Face detection using FaceAPI.js
  - Object detection using COCO-SSD
  - Image similarity embeddings using MobileNet
  - TensorFlow.js backend with multiple runtime options (CPU, WASM, Node)
- **REST Endpoints**:
  - `/embeddings` - Image similarity vectors
  - `/objects` - Object detection results
  - `/faces` - Face detection and recognition

### Storage and Streaming

#### `storage/` - File Storage Abstraction
- **Purpose**: Abstracts file storage operations
- **Key Functions**: File reading/writing, storage validation, path management

#### `stream/` - Processing Pipelines
- **Purpose**: Provides streaming and pipeline utilities
- **Key Functions**: Parallel processing, task queues, stream transformations

#### `fetch/` - Remote Data Access
- **Purpose**: Handles fetching data from remote HomeGallery instances
- **Key Functions**: Remote database synchronization, API communication

### Export and Distribution

#### `export-static/` - Static Export
- **Purpose**: Exports gallery as static website
- **Key Functions**:
  - Database optimization for static deployment
  - Web application bundling
  - Archive creation
  - Standalone gallery generation

#### `export-meta/` - Metadata Export
- **Purpose**: Exports metadata in various formats
- **Key Functions**: JSON/CSV export, custom format support

#### `bundle/` - Application Bundling
- **Purpose**: Creates distribution packages
- **Key Functions**: Binary bundling, dependency packaging

### Extensibility

#### `plugin/` - Plugin System
- **Purpose**: Extensible plugin architecture
- **Key Functions**:
  - Plugin discovery and loading
  - Template system for creating new plugins
  - Plugin manager for lifecycle management
- **Plugin Types**:
  - Extractor plugins (data processing)
  - Database mapper plugins (data transformation)
  - Query plugins (search extensions)

#### `query/` - Search Engine
- **Purpose**: Powerful query and search capabilities
- **Key Functions**:
  - Query language parsing and execution
  - Full-text search
  - Date, location, and metadata filtering
  - Custom query extensions

### Media Casting

#### `cast/` - Media Casting
- **Purpose**: Cast photos and videos to external devices
- **Key Functions**: Chromecast support, DLNA streaming

### Development

#### `dev-tools/` - Development Utilities
- **Purpose**: Development and build tools
- **Key Functions**: Build scripts, development helpers

#### `events/` - Event System
- **Purpose**: Event-driven architecture support
- **Key Functions**: Event publishing/subscribing, user action tracking

## Additional Directories

### `e2e/` - End-to-End Testing
- **Purpose**: Comprehensive integration testing using Gauge framework
- **Structure**:
  - `specs/` - Test specifications organized by feature
  - `tests/` - Step implementations and test utilities
  - `env/` - Test environment configurations

### `examples/` - Configuration Examples
- **Purpose**: Example configurations and setup files
- **Files**: Sample exclude patterns, configuration templates

### `scripts/` - Build and Utility Scripts
- **Purpose**: Build automation and utility scripts
- **Key Scripts**:
  - `build-info.sh` - Build information generation
  - `bundle.js` - Application bundling logic
  - `download-nodejs.js` - Node.js runtime downloading

## Architecture Patterns

### Plugin-Based Architecture
The application uses a extensive plugin system allowing:
- Custom extractors for new file types or metadata sources
- Database mappers for custom data transformations
- Query extensions for specialized search capabilities

### Event-Driven Design
- Real-time updates through WebSocket events
- User action tracking and synchronization
- Reactive UI updates based on data changes

### Microservices Approach
- Separate API server for AI processing
- Modular packages that can be deployed independently
- Clear separation of concerns between components

### Progressive Enhancement
- Works offline with service workers
- Graceful degradation when AI services unavailable
- Responsive design for various screen sizes

This modular architecture allows HomeGallery to be highly customizable, scalable, and maintainable while providing a rich feature set for personal photo and video management.
