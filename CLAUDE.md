# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VibeSynth is an Electron desktop app (macOS/Windows/Linux) that generates real, runnable applications from AI design prompts. Unlike Google Stitch (which outputs static design images), VibeSynth generates actual React code, runs it on a local Vite dev server, and displays the live app in a separate popup window with HMR for instant updates.

The PRD is in `design01.md`. Reference screenshots from Stitch are in `screenshots/`.

## Architecture

- **Electron main process**: Window management (main canvas + live app popup), local dev server lifecycle, file system operations, project management
- **Electron renderer (main window)**: React + Tailwind CSS — dashboard, design canvas editor, prompt bar, agent log, design system cards
- **Live App popup window**: Separate BrowserWindow loading `localhost:PORT` where the generated app runs
- **Generated projects**: React + Vite + TypeScript apps written to `~/VibeSynth/projects/`, served by a child-process Vite dev server
- **AI layer**: Gemini API (`VITE_GEMINI_API_KEY` in `.env`) for code generation and design system creation

### Key Design Decisions

- **Two-window model**: Main canvas gets full screen; live app is a separate popup (not split view) so it can float on another monitor
- **Design system is Stitch-identical**: 4 color roles (Primary/Secondary/Tertiary/Neutral) x 12 tone scale (T0-T100), 3 typography levels (Headline/Body/Label), component library (4 button types, search bar, bottom nav, FAB, chips, icons)
- **No Figma export, no preview mode, no docs page** — the app is always live
- **Phase 1 is UI-first**: Build all UI without AI integration, then wire up Gemini

## Tech Stack

- **Build**: electron-vite
- **Renderer**: React 18+, TypeScript, Tailwind CSS
- **Generated apps**: React + Vite + TypeScript (fixed, Vue/Svelte deferred)
- **AI**: Google Gemini API via `@google/generative-ai`
- **Testing**: Playwright for E2E (test against both VibeSynth and stitch.withgoogle.com for UX parity)

## Environment

- `.env` contains `VITE_GEMINI_API_KEY` — never commit this
- Node.js 20+, npm 10+
