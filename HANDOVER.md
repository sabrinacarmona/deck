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
  - **Zustand** (`^5.0.0`) is installed in `package.json` but currently, the app relies heavily on a global React Context (`PlayerContext.tsx`) for Spotify Playback State, Token Management, and User Profile data. 
  - *Recommendation: Future state scaling should migrate from the monolithic `PlayerContext` to Zustand slices.*
- **Styling:** Vanilla CSS (`index.css`) emphasizing a dark-themed, glassmorphic design system using CSS variables (`var(--bg-card)`) for maintainability.
- **Routing:** `react-router-dom` v7.
- **Icons:** `lucide-react`.

---

## 🔐 Auth & The Spotify Web Playback SDK

### OAuth Flow & Persistence
Authentication is handled via the **OAuth 2.0 PKCE Flow** in `src/api/auth.ts`.
- The `@fabianlars/tauri-plugin-oauth` library spins up a temporary localhost server on port `1421` to capture the Spotify callback token securely without deep-linking complexities on macOS.
- **⚠️ Security/Persistence Note:** Access and Refresh tokens are currently persisted insecurely via standard HTML5 `window.localStorage`. While fine for the MVP, production releases should migrate to Tauri's native Secure Storage Plugin (`tauri-plugin-store`) to encrypt these tokens at rest on the user's filesystem.

### Web Playback SDK Limitations
The app injects the Spotify Web Playback SDK (`https://sdk.scdn.co/spotify-player.js`) into `index.html`.
- **DRM Notice:** The official Spotify SDK relies on Encrypted Media Extensions (EME). Tauri uses the native OS webview (WebKit on macOS). The SDK strictly functions as a *remote control* for other active Spotify Connect devices (like your phone or the official desktop app) currently. It cannot currently output raw audio buffer directly through the Tauri WebKit wrapper natively without advanced DRM bridging.

---

## 🛠️ Work Completed (v0.1.0)

### 1. Core UI Components & Views
- **Sidebar:** Navigation menu linking to Home, Search, and Library.
- **Playbar (`Playbar.tsx`):** Persistent bottom control bar with mapped Playback SDK controls (play/pause, skip, shuffle, repeat) and volume controls.
- **MainContent/Home (`MainContent.tsx`):** Displays featured playlists, recently played items, and quick mixes.
- **Search (`SearchModal.tsx`):** Modal overlay relying on `lodash.debounce` for real-time track and artist searches.
- **Liked Songs (`LikedSongs.tsx`) & Playlist View (`PlaylistView.tsx`):** Renders collections of tracks.

### 2. Technical Debt & Type Safety Refactoring
- **Strict TypeScript Enforcement:** Eradicated over 20+ instances of `any` types that bypassed the compiler.
  - Sourced strict interfaces (`SpotifyTrack`, `SpotifyArtist`, etc.) into a global `src/types/spotify.d.ts`.
  - Replaced unsafe `catch (e: any)` statements with `catch (err: unknown)` utilizing standard `Error` type extraction across `auth.ts` and `spotify.ts`.
- **UI Component Extraction (`TrackList.tsx`):** 
  - Extracted highly duplicated table-rendering logic from `PlaylistView` and `LikedSongs` into a strongly-typed, reusable `<TrackList />` component, reducing parent view file sizes by over 50%.
- **Verification:** The codebase complies structurally, outputting 0 errors on `npx tsc --noEmit`.

### 3. Graceful Error Handling & Development Mode Limits
- **Issue:** Fetching playlists not owned by the developer while the Spotify App is in "Development Mode" resulted in a `403 Forbidden` error protecting user data.
- **Resolution:** 
  - The API layer intentionally maps `403` to `"Spotify Premium Required or Restricted Playlist (403 Forbidden)"`.
  - `PlaylistView.tsx` detects this error and mounts a custom warning banner explaining the limitation instead of crashing or showing a blank table. Users are guided to request a quota extension or duplicate playlists they wish to view.

---

## ⚙️ Building & Distribution

### Production Builds
To compile the raw React application and package it within Tauri into a native macOS backend (`.app`, `.dmg`):
```bash
npm run tauri build
```
- **App Code Signing:** For macOS distribution, you must configure Apple Developer Certificates inside `src-tauri/tauri.conf.json` to sign the compiled `.dmg`/`.app` packages. Without this, users will face massive "Malicious Software" blocks by macOS Gatekeeper indicating the app is from an Unidentified Developer.

### Custom Deep Linking (Future)
Currently, authentication bypasses deep-link routing by explicitly opening port `1421`. If migrating to a standard URI scheme (e.g. `deck://callback`), `tauri-plugin-deep-link` must be installed natively and associated with macOS `Info.plist` manifests.

---

## 🧪 Testing Environment
**Current State:** There are **zero** automated tests (Unit, Integration, or E2E) integrated into the project.
- **Recommendation:** Implement `Vitest` with `React Testing Library` for DOM and state verifications. Given the heavy reliance on the remote Spotify API, Mock Service Worker (`msw`) implementation will be critical for mocking out the heavy network payloads during CI/CD cycles without exceeding rate limits.

---

## 🔮 Next Steps

1. **Production Relocation:** Before releasing to production, request a quota extension from Spotify via the Developer Dashboard to remove the 403 API barriers for end-users interacting with external playlists.
2. **State Migration:** Move complex playback queue polling and caching logic out of `PlayerContext.tsx` and into `Zustand` to prevent unnecessary re-renders of the entire app tree.
3. **Performance:** Virtualize the `TrackList` component (e.g., using `react-window` or `@tanstack/react-virtual`) as rendering DOM nodes for exceptionally large playlists (1000+ songs) will cause scroll lag.

---
*Document generated on conclusion of the primary development and refactoring phase.*
