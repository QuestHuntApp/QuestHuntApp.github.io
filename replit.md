# QuestHunt - Gamified Todo Application

## Overview

QuestHunt is a modern, gamified todo list application that transforms everyday tasks into engaging quests. Built specifically to help users with ADHD and other productivity challenges, it features a comprehensive reward system, streak tracking, and progress analytics. The application runs entirely in the browser using localStorage for data persistence, making it a self-contained productivity tool that can be deployed as a static site.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS for utility-first styling with Shadcn/ui component library for consistent, accessible components
- **State Management**: Local component state with React hooks, no global state management library needed
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Data Storage Strategy
- **Primary Storage**: Browser localStorage for client-side data persistence
- **Data Structure**: JSON-based schemas using Zod for validation
- **Backup/Restore**: Built-in data export/import functionality to prevent data loss
- **No Backend Required**: Completely client-side application eliminates server dependencies

### Key Feature Implementation
- **Quest System**: Multiple quest types (once, daily, weekly, count-based) with customizable rewards and priorities
- **Gamification**: Coin-based reward system, streak tracking, and progress analytics
- **Responsive Design**: Mobile-first approach with floating navigation for optimal mobile experience
- **Theme Support**: Dark/light mode toggle with system preference detection
- **Data Validation**: Comprehensive Zod schemas ensure data integrity across all features

### Component Architecture
- **Modular Design**: Feature-based component organization with clear separation of concerns
- **Reusable UI**: Consistent component library using Radix UI primitives with custom styling
- **Modal System**: Centralized modal management for creating and editing quests/rewards
- **View System**: Tab-based navigation between different app sections (quests, rewards, progress, profile)

## External Dependencies

### UI and Styling
- **@radix-ui/***: Complete suite of unstyled, accessible UI primitives for complex components
- **tailwindcss**: Utility-first CSS framework for rapid UI development
- **class-variance-authority**: Type-safe variant handling for component styling
- **lucide-react**: Consistent icon library for UI elements

### Form and Validation
- **react-hook-form**: Performant form library with minimal re-renders
- **@hookform/resolvers**: Validation resolver for integrating Zod with React Hook Form
- **zod**: TypeScript-first schema validation for data integrity

### Data Visualization
- **recharts**: React charting library for progress tracking and analytics visualization

### Development Tools
- **@tanstack/react-query**: Data fetching and caching (configured for future API integration)
- **wouter**: Minimal routing library for single-page application navigation
- **date-fns**: Modern date utility library for handling quest scheduling and deadlines

### Build and Development
- **vite**: Fast build tool with hot module replacement for development
- **typescript**: Static type checking for enhanced developer experience
- **nanoid**: Unique ID generation for client-side data management

### Database Schema (Drizzle ORM)
While currently using localStorage, the application includes Drizzle ORM configuration for potential future database integration:
- **drizzle-orm**: Type-safe database access layer
- **@neondatabase/serverless**: Serverless PostgreSQL driver for cloud deployment
- **drizzle-kit**: Database migration and schema management tools

This architecture allows for seamless migration from localStorage to a full database solution when needed while maintaining the same data structures and validation logic.