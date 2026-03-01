# Deck: A Minimalist Spotify Client

Deck is a distraction-free, minimalist desktop music player built for Mac. It serves as a sleek remote control for your Spotify playback, providing just the features you need to stay in the zone.

## Features
- **Native macOS Experience:** Built with Tauri for a lightweight, blazing-fast application.
- **Secure Authentication:** Uses a native PKCE OAuth flow, so your Spotify credentials stay secure without needing a backend server.
- **Minimalist UI:** A clean, dark-themed interface focused purely on your music.
- **Library Integration:** Instantly access your most recently played tracks and your personal playlists.

## Technology Stack
- **Frontend:** React 19, Vite, TypeScript
- **Styling:** Vanilla CSS
- **Backend/Desktop:** Rust, Tauri v2
- **APIs:** Spotify Web API

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sabrinacarmona/deck.git
   cd deck
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Spotify API:**
   - Create a Spotify Application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
   - Set the Redirect URI in the dashboard to: `http://127.0.0.1:1421`
   - Create a `.env` file in the root directory and add your Client ID:
     ```env
     VITE_SPOTIFY_CLIENT_ID=your_client_id_here
     ```

4. **Run the App Locally:**
   ```bash
   npm run tauri dev
   ```

5. **Build the macOS App:**
   ```bash
   npm run tauri build
   ```

## Design Philosophy
Deck focuses on reducing cognitive load. There are no social feeds, podcasts, or infinite scroll discovery pages—just your library, your recent tracks, and a beautiful playbar.
