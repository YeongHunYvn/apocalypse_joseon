# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator  
- `npm run web` - Run in web browser

### Testing & Quality
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run test:coverage` - Run tests with coverage report
- `npm run validate-data` - Validate game data JSON files

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking

## Project Architecture

### Core Game Architecture
This is a React Native text-based roguelike game with a sophisticated scene engine and state management system.

**Key Components:**
- **SceneEngine** (`utils/scene/SceneEngine.ts`) - Core game logic engine that manages scene transitions, conditions, and effects
- **GameStateContext** (`contexts/GameStateContext.tsx`) - Global state management using React Context + useReducer
- **ChapterManager** - Manages game chapters (rest rooms, story sections) with automatic scene selection
- **TextProcessor** - Handles dynamic text with variables (`${stats:strength}`) and effects (`{{red}}text{{red}}`)

### Game State System
The game uses a comprehensive state system:
- **Stats**: strength, agility, wisdom, charisma (0-10 range)
- **Resources**: health, mind (0-3 range, game over if either reaches 0)
- **Experience System**: Unified exp system supporting auto/manual leveling for any experience type
- **Dynamic Variables**: User-defined numeric variables managed via `variables.json`
- **Buffs/Flags/Items**: JSON-managed game state with metadata

### Scene-Based Game Flow
- **Scenes** are the core game unit (JSON files with unique IDs starting with `scn_`)
- **Chapters** group related scenes (rest rooms, story sections)
- **Conditional Logic**: Scenes have conditions that determine when they appear
- **Effect System**: Scenes can modify game state when entered
- **Choice System**: Player choices with probability-based outcomes

### Data Management
- **JSON-Based Configuration**: Game data (buffs, flags, items, variables) stored in `/assets/config/`
- **Scene Data**: Stored in `/assets/chapters/` with chapter-based organization
- **Dynamic Text Variables**: Support for `${category:key}` syntax in scene text
- **Text Effects**: Rich text formatting with `{{effect}}text{{effect}}` syntax

## Key File Locations

### Core Game Logic
- `utils/scene/SceneEngine.ts` - Main game engine
- `contexts/GameStateContext.tsx` - Global state management
- `utils/scene/text/TextProcessor.ts` - Text processing with variables and effects
- `utils/scene/conditions/ConditionChecker.ts` - Scene condition evaluation

### Game Data
- `/assets/config/` - JSON configuration files (buffs, flags, items, variables)
- `/assets/chapters/` - Scene data organized by chapters
- `/constants/gameConfig.ts` - Core game constants and initial state

### UI Components
- `screens/StoryScreen.tsx` - Main game screen
- `components/SceneText.tsx` - Scene text display with effects
- `components/ChoiceButton.tsx` - Interactive choice buttons

### Type Definitions
- `types/index.ts` - Comprehensive TypeScript definitions for all game entities

## Development Guidelines

### Working with Game Data
- Always use the JSON configuration system for buffs, flags, items, and variables
- Scene conditions must reference only JSON-defined IDs
- Use the `validate-data` script to check JSON file integrity
- Text variables use `${category:key}` syntax (e.g., `${stats:strength}`, `${resources:health}`)

### State Management
- Never modify game state directly - always use the reducer actions
- Use the provided hooks (`useGameState`, `useStoryLogic`, etc.) for state access
- Scene effects are the primary way to modify game state

### Scene Development
- Scene IDs must start with `scn_` prefix
- All scenes need fallback options for when conditions aren't met
- Use `type: 'event'` for repeatable scenes, default types are one-time only
- Scene conditions are evaluated for random selection, but `next` transitions bypass conditions

### Testing
- Unit tests focus on game logic (scene engine, conditions, effects)
- Integration tests cover complete game flows
- Use test fixtures in `/tests/fixtures/` for consistent test data

### Code Style
- Follow existing TypeScript patterns and interfaces
- Use descriptive variable names reflecting game terminology
- Document complex game logic with inline comments