# Deck: Minimalist Spotify Client - Developer Handover Document

## Project Overview
**Deck** is a minimalist macOS application built with **Tauri, React, and Vite**. It serves as a streamlined, lightweight Spotify client that leverages the Spotify Web API. The core objective of this project was to provide essential music playback and library management features while maintaining a clean, premium, and dynamic UI/UX.

---

## 🚀 Getting Started (Developer Setup)

### Prerequisites
- **Node.js**: (v18+ recommended)
- **Package Manager**: `npm` (The project relies on `package-lock.json`).
- **Rust**: Required by Tauri to compile the macOS application backend.

### Setup Instructions
1. **Clone & Install**:
   ```bash
   git clone <repository-url>
   cd Deck
   npm install
   ```
2. **Environment Variables**:
   Create a `.env` file in the root directory (alongside `package.json`).
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   ```
   *Note: You must obtain a Client ID from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). Enable the "Web API" and "Web Playback SDK".*
3. **Spotify Dashboard Redirect URIs**:
   You must whitelist the local Tauri OAuth callback port in your Spotify Developer App settings:
   - `http://127.0.0.1:1421`
4. **Run Development Server**:
   ```bash
   npm run tauri dev
   ```
   *This single command boots the Vite frontend and the Tauri rust backend concurrently.*

---

## 🗂️ Project Directory Structure

```text
Deck/
├── package.json          # Node dependencies and build scripts
├── tauri.conf.json       # Top-level Tauri frontend/backend mappings
├── src-tauri/            # **Rust Backend** (System integrations, OS APIs)
│   ├── Cargo.toml        # Rust dependencies
│   ├── src/main.rs       # Entrypoint for the Tauri application
│   └── tauri.conf.json   # Deep Tauri configuration (Windows, Icons, Bundle IDs)
├── src/                  # **React Frontend**
│   ├── api/              # Spotify & Auth fetch wrappers (`auth.ts`, `spotify.ts`)
│   ├── components/       # Reusable UI components (`Playbar`, `Sidebar`, `TrackList`)
│   ├── contexts/         # Global App State (`PlayerContext.tsx`)
│   ├── types/            # Global TypeScript definitions (`spotify.d.ts`)
│   ├── App.tsx           # Main React Router hub
│   └── index.css         # Global CSS variables and glassmorphic design system
```

---

## 🏗️ Architecture & Technology Stack

- **Frontend Framework:** React 18 (via Vite).
- **Desktop Runtime:** Tauri v2. (`@tauri-apps/api`, `@tauri-apps/cli`).
- **State Management:** 
  - **PlayerContext.tsx**: Currently, the app relies heavily on a global React Context for Spotify Playback State, Token Management, and User Profile data.
  - **Zustand**: (`^5.0.0`) is installed in `package.json` but completely unused. If state isn't migrated to Zustand in the immediate future, removing it to reduce dependency bloat and CVE surface area is highly recommended.
- **Styling:** Vanilla CSS (`index.css`) emphasizing a dark-themed, glassmorphic design system using CSS variables (`var(--bg-card)`) for maintainability.
- **Routing:** `react-router-dom` v7.
- **Icons:** `lucide-react`.

---

## 🔐 Auth & The Spotify Web Playback SDK

### OAuth Flow & Persistence
Authentication is handled via the **OAuth 2.0 PKCE Flow** in `src/api/auth.ts`.
- The `@fabianlars/tauri-plugin-oauth` library spins up a temporary localhost server on port `1421` to capture the Spotify callback token securely without deep-linking complexities on macOS.
- **⚠️ Security/Persistence Note:** Access and Refresh tokens are currently persisted insecurely via standard HTML5 `window.localStorage`. While fine for the MVP, production releases must migrate to Tauri's native Secure Storage Plugin (`tauri-plugin-store`) to encrypt these tokens at rest on the user's filesystem.

### Web Playback SDK Limitations
The app injects the Spotify Web Playback SDK (`https://sdk.scdn.co/spotify-player.js`) into `index.html`.
- **DRM Notice:** The official Spotify SDK relies on Encrypted Media Extensions (EME). Tauri uses the native OS webview (WebKit on macOS). The SDK strictly functions as a *remote control* for other active Spotify Connect devices (like your phone or the official desktop app) currently. It cannot currently output raw audio buffer directly through the Tauri WebKit wrapper natively without advanced DRM bridging.

---

## 🛠️ Work Completed (v0.1.0)

### 1. Core UI Components & Views
- **Sidebar:** Navigation menu linking to Home, Search, and Library.
- **Playbar (`Playbar.tsx`):** Persistent bottom control bar with mapped Playback SDK controls (play/pause, skip, shuffle, repeat) and volume controls.
- **Search (`SearchModal.tsx`):** Modal overlay relying on `lodash.debounce` for real-time track and artist searches.
- **Liked Songs & Playlist View:** Interactive tables rendering collections of tracks.

### 2. Technical Debt & Type Safety Refactoring
- **Strict TypeScript Enforcement:** Eradicated over 20+ instances of `any` types that bypassed the compiler.
  - Sourced strict interfaces (`SpotifyTrack`, `SpotifyArtist`, etc.) into a global `src/types/spotify.d.ts`.
  - Replaced unsafe `catch (e: any)` statements with `catch (err: unknown)`.
- **UI Component Extraction (`TrackList.tsx`):** 
  - Extracted highly duplicated table-rendering logic from `PlaylistView` and `LikedSongs` into a strongly-typed, reusable `<TrackList />` component.
- **Verification:** The codebase complies structurally, outputting 0 errors on `npx tsc --noEmit`.

### 3. Graceful Error Handling & Development Mode Limits
- **Issue:** Fetching playlists not owned by the developer while the Spotify App is in "Development Mode" resulted in a `403 Forbidden` error protecting user data.
- **Resolution:** `PlaylistView.tsx` detects this error and mounts a custom warning banner explaining the developer mode limitation instead of crashing.

---

## 🚨 Production & Infrastructure Readiness (Critical Blockers)

Before declaring this application production-ready or distributing it to users, the following architectural gaps must be addressed:

### 1. CI/CD Pipeline & Auto-Updater
- **Missing Build Automation:** There are currently no GitHub Actions workflows to compile Universal macOS binaries (Silicon + Intel). Relying on local developer `npm run tauri build` execution is a risk.
- **Updates:** Tauri's `tauri-plugin-updater` must be configured. Without it, users will be permanently stuck on v0.1.0 unless they manually redownload `.dmg` files for every patch.

### 2. Production Error Tracking
- **Blind Runtime:** A desktop app cannot rely on `console.error()`. We currently have zero visibility into production frontend crashes or Rust backend panics.
- **Action:** Integrate a crash reporting tool (e.g., Sentry, Datadog) to capture unhandled promise rejections and boundaries. 

### 3. Data Privacy & PII Mapping
- **Scope Awareness:** The app requests `user-read-email` and `user-read-private`. 
- **Action:** If crash reporting (Sentry) is added, ensure the logger is strictly scrubbing PII (email, user ID, real name) before transmission to avoid immediate GDPR/CCPA violations. 

### 4. Code Signing & Gatekeeper
- **macOS Blocks:** Mac distribution requires Apple Developer Certificates configured inside `src-tauri/tauri.conf.json`. Without notarization, macOS Gatekeeper will block the application as "Malicious Software".

### 5. Memory Management & GPU Drain (Virtualization)
- **Glassmorphism + Huge DOM:** Rendering 1,000+ DOM nodes in `TrackList.tsx` mixed with heavy CSS backdrops inside Tauri's WebKit wrapper will cause severe scroll lag and battery drain.
- **Action:** `react-window` or `@tanstack/react-virtual` is a mandatory blocker for production release.

### 6. Automated Testing Vacuum
- **The Gap:** There are zero automated tests.
- **Action:** Implement `Vitest` with `React Testing Library`. Configure Mock Service Worker (`msw`) so CI/CD pipelines don't exhaust Spotify API rate limits during test runs.

---

## 🎨 UI/UX & Design System Deficiencies (UX Blockers)

While the engineering infrastructure has been mapped, the UI/UX layer contains significant gaps that negatively impact usability and drop-off rates. These must be addressed by design and frontend teams:

### 1. Accessibility (a11y) & Contrast
- **The Flaw:** The current "Glassmorphism" design system lacks documented WCAG contrast compliance. Furthermore, there is zero keyboard navigation support or `aria-labels` for screen readers.
- **Action:** Conduct an accessibility audit. Implement keyboard shortcuts (e.g., `Space` to play/pause, `Arrows` to skip) and ensure all intractable DOM nodes are tab-indexed.

### 2. The "First Run" Empty State
- **The Flaw:** When a brand-new Spotify user (with zero liked songs and zero playlists) logs in, they are met with a completely empty library and no Call-to-Action (CTA). This is a dead end for user retention.
- **Action:** Design and implement "Empty States" that guide users to discover, search, or play featured quick mixes when their personal context is blank.

### 3. "Offline" or "Rate-Limited" UX States
- **The Flaw:** The app relies entirely on the live Spotify API. If the network drops or Spotify rate-limits the developer key, the app fails silently or displays blank screens. 
- **Action:** Design "Skeleton Loaders" for data fetching states and implement "Toast Notifications" translating network/API failures into human-readable alerts.

### 4. Responsiveness & Window Management
- **The Flaw:** Tauri configures a rigid `800x600` default window. There is no documented behavior for extreme window resizing.
- **Action:** Define responsive CSS breakpoints. Consider adding a dedicated "Mini Player" layout mode for when the application is squeezed horizontally.

---
*Document generated on conclusion of the primary development and refactoring phase.*
