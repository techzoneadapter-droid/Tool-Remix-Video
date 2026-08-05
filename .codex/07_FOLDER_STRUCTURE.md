# OFFICIAL PROJECT STRUCTURE
Version 1.0

==========================================================
PURPOSE
==========================================================

This document defines the official folder structure.

The architecture is FINAL.

Do not reorganize folders.

Do not create duplicate modules.

Always follow this structure.

==========================================================
ARCHITECTURE
==========================================================

The project follows a Feature + Layer architecture.

Each module must have a single responsibility.

Business logic must never live inside UI components.

UI must never call AI providers directly.

Everything goes through Services.

==========================================================
PROJECT STRUCTURE
==========================================================

project/

│
├── src/
│
├── assets/
│
├── components/
│
├── features/
│
├── services/
│
├── providers/
│
├── hooks/
│
├── stores/
│
├── types/
│
├── utils/
│
├── lib/
│
├── layouts/
│
├── pages/
│
├── routes/
│
├── styles/
│
├── constants/
│
├── config/
│
├── workers/
│
├── database/
│
├── tauri/
│
└── tests/

==========================================================
FEATURES
==========================================================

Every major feature owns its own folder.

Example

features/

AutoRemix/

AutoTranslate/

AutoMagic/

History/

Projects/

Settings/

Every feature contains:

components/

hooks/

services/

types/

utils/

pages/

Never mix feature code.

==========================================================
COMPONENTS
==========================================================

components/

Contains reusable UI only.

Example

Button

Card

Dialog

Input

Dropdown

Sidebar

Navbar

Progress

Table

VideoPlayer

Do not place business logic here.

==========================================================
SERVICES
==========================================================

services/

Contains application logic.

Example

VideoService

ProjectService

ExportService

SubtitleService

HistoryService

SettingsService

Only services communicate with providers.

==========================================================
PROVIDERS
==========================================================

providers/

Every external AI gets its own folder.

Example

Gemini/

Deepgram/

ElevenLabs/

GoogleVeo/

Kling/

Runway/

Flux/

Every provider exposes one interface.

Never call provider APIs anywhere else.

==========================================================
WORKERS
==========================================================

workers/

Background jobs.

Heavy processing.

Video Rendering

Batch Processing

Export Queue

AI Queue

Never block UI.

==========================================================
HOOKS
==========================================================

hooks/

Reusable React hooks.

Example

useProject()

useCredits()

useVideo()

useExport()

Do not place API logic inside hooks.

==========================================================
STORES
==========================================================

stores/

Global state only.

Use Zustand.

Example

AppStore

UserStore

ProjectStore

SettingsStore

HistoryStore

==========================================================
DATABASE
==========================================================

database/

SQLite

Repositories

Migrations

Never access SQLite directly from UI.

==========================================================
CONFIG
==========================================================

config/

Environment

API Keys

Feature Flags

Provider Config

Default Settings

==========================================================
UTILS
==========================================================

utils/

Pure helper functions.

No side effects.

==========================================================
TYPES
==========================================================

types/

Shared interfaces.

Enums.

Models.

Never duplicate types.

==========================================================
ASSETS
==========================================================

assets/

Images

Icons

Fonts

Videos

Animations

Never place assets inside features.

==========================================================
PAGES
==========================================================

pages/

Top level pages only.

Home

Projects

History

Settings

About

==========================================================
LAYOUTS
==========================================================

layouts/

Main Layout

Dashboard Layout

Authentication Layout

==========================================================
ROUTES
==========================================================

routes/

Application routing only.

==========================================================
STYLES
==========================================================

styles/

Global styles.

Tailwind extensions.

Theme.

Variables.

==========================================================
TESTS
==========================================================

tests/

Unit

Integration

E2E

==========================================================
FILE NAMING
==========================================================

Components

PascalCase

VideoCard.tsx

SettingsDialog.tsx

Pages

PascalCase

HomePage.tsx

Services

PascalCase

VideoService.ts

Hooks

camelCase

useVideo.ts

Stores

PascalCase

ProjectStore.ts

Types

PascalCase

Project.ts

Subtitle.ts

==========================================================
IMPORT RULES
==========================================================

Never use long relative imports.

Prefer aliases.

Example

@/components

@/features

@/services

@/providers

==========================================================
AI FLOW
==========================================================

UI

↓

Feature

↓

Service

↓

Provider

↓

AI API

↓

Service

↓

UI

Never bypass this flow.

==========================================================
DO NOT
==========================================================

Do not duplicate files.

Do not create temporary folders.

Do not create "new", "new2", "old", "backup" folders.

Do not leave unused files.

Do not leave dead code.

Remove obsolete files immediately.

==========================================================
REFACTOR RULES
==========================================================

You have permission to:

Create folders.

Delete obsolete folders.

Move files.

Rename files.

Split large files.

Merge duplicated code.

Optimize architecture.

But you must preserve the official folder structure.

==========================================================
FINAL RULE
==========================================================

If a new feature is added,
integrate it into the existing architecture.

Never redesign the architecture.

Never break the folder structure.

Keep the project clean,
predictable,
maintainable,
and production-ready.