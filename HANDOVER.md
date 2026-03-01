# Deck: Minimalist Spotify Client - Developer Handover Document

## Project Overview
**Deck** is a minimalist macOS application built with **Tauri, React, and Vite**. It serves as a streamlined, lightweight Spotify client that leverages the Spotify Web API. The core objective of this project was to provide essential music playback and library management features while maintaining a clean, premium, and dynamic UI/UX.

## Architecture & Technology Stack
- **Frontend Framework:** React 18, set up via Vite.
- **Desktop Runtime:** Tauri (allows packaging the web app as a native macOS application).
- **Styling:** Vanilla CSS intentionally chosen for maximum flexibility, employing a dark-themed, glassmorphic design system with subtle micro-animations.
- **API Integration:** Spotify Web API for fetching user data, playlists, saved tracks, and controlling playback.
- **Icons:** `lucide-react` for consistent, lightweight vector iconography.

## Work Completed

### 1. Initial Project Setup & Authentication
- Initialized the Tauri + React + Vite environment.
- Integrated Spotify's OAuth 2.0 PKCE flow in `src/api/auth.ts`.
- Implemented `Spotify Web Playback SDK` to allow the app to act as a Spotify Connect device, managing playback directly within the app interface.
- App icons and basic packaging configurations for macOS were configured.

### 2. Core UI Components & Views
- **Sidebar:** Navigation menu linking to Home, Search, and Library.
- **Playbar:** Persistent bottom control bar with play/pause, skip, shuffle, repeat, volume controls, and current track metadata.
- **MainContent/Home (`MainContent.tsx`):** Displays featured playlists, recently played items, and quick mixes.
- **Search (`SearchModal.tsx`):** A modal overlay with debounced API queries, rendering real-time track search results. Supports infinite scrolling.
- **Liked Songs (`LikedSongs.tsx`):** Displays the user's saved tracks with lazy loading/infinite scrolling.
- **Playlist View (`PlaylistView.tsx`):** Displays tracks from a specific playlist. Handled specific edge cases related to Spotify developer restrictions.

### 3. Graceful Error Handling & Development Mode Limits
- **Issue:** Fetching playlists not owned by the developer while the Spotify App is in "Development Mode" resulted in a `403 Forbidden` error.
- **Resolution:** As this is a platform limitation, we implemented a graceful UI fallback.
  - The API layer maps `403` to a specific error message.
  - `PlaylistView.tsx` detects this error and hides the generic track headers, instead rendering a custom warning banner explaining the limitation. It guides the user to request a quota extension or duplicate the playlist.

### 4. Technical Debt Refactoring (TypeScript & UI Deduplication)
As the app grew, technical debt was addressed to ensure long-term maintainability:
- **Strict TypeScript Enforcement:** Removed over 20 instances of `any` types that bypassed the compiler.
  - Created `src/types/spotify.d.ts` defining strict interfaces (`SpotifyTrack`, `SpotifyArtist`, `SpotifyAlbum`, `SpotifyDevice`, etc.).
  - Refactored `PlayerContext.tsx`, `SearchModal.tsx`, `Playbar.tsx`, and API files to strictly adhere to these interfaces.
  - Replaced unsafe `catch (e: any)` statements with `catch (err: unknown)` utilizing standard `Error` type extraction.
- **UI Component Extraction (`TrackList.tsx`):** 
  - The inline logic for rendering tables of tracks (#, Title, Time columns) was heavily duplicated across `PlaylistView.tsx` and `LikedSongs.tsx`.
  - Extracted this logic into a highly reusable, strongly-typed `<TrackList />` component.
  - This reduced UI parsing logic in parent views by over 50% and provided a single source of truth for track list interactions.
- **Verification:** Ensures the codebase compiles cleanly with `npx tsc --noEmit` yielding 0 errors.

## Next Steps / Future Considerations
1. **Device Management:** Ensure the app handles switching active playback devices smoothly if the user seamlessly transitions between their mac, phone, or other speakers.
2. **Additional Views:** Implementing artist pages or album-specific views.
3. **Production Relocation:** Before releasing to production, request a quota extension from Spotify via the Developer Dashboard to remove the 403 barriers for end-users pulling external playlists.
4. **Performance:** Consider virtualizing the `TrackList` component (e.g., `react-window`) if users report lag when loading exceptionally large playlists (1000+ songs).

---
*Document generated on conclusion of the primary development and refactoring phase.*
