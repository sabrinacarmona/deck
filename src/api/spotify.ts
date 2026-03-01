import { getToken, logout } from './auth';

async function fetchWebApi(endpoint: string, method: string, body?: Record<string, unknown>) {
    const token = getToken();
    if (!token) throw new Error('No access token');

    const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method,
        body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
        if (res.status === 401) {
            logout();
            throw new Error('Token expired');
        }

        try {
            const errorData = await res.json();
            if (errorData?.error?.message) {
                throw new Error(errorData.error.message);
            }
        } catch (e: unknown) {
            // If json parse fails or we just threw the inner error, handle it
            const errMessage = e instanceof Error ? e.message : '';
            if (errMessage && errMessage !== 'Unexpected end of JSON input') {
                throw e; // rethrow the actual API message
            }
        }

        // Fallbacks
        if (res.status === 403) throw new Error('Spotify Premium Required or Restricted Playlist (403 Forbidden)');
        if (res.status === 404) throw new Error('No Active Device Found (404 Not Found)');
        throw new Error(`Spotify API Error: ${res.status} ${res.statusText}`);
    }

    if (res.status === 204) return null; // No content (e.g., play/pause success)

    // Check for other errors in JSON payload before returning
    const data = await res.json();
    if (data.error && data.error.status >= 400) {
        throw new Error(data.error.message || 'Spotify API Error');
    }

    return data;
}

export async function fetchAbsoluteWebApi(url: string, method: string = 'GET') {
    const token = getToken();
    if (!token) throw new Error('No access token');

    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method
    });

    if (res.status === 401) {
        logout();
        throw new Error('Token expired');
    }

    if (res.status === 204) return null;

    return res.json();
}

// User Profile
export async function getProfile() {
    return fetchWebApi('me', 'GET');
}

// Playlists
export async function getUserPlaylists() {
    return fetchWebApi('me/playlists?limit=50', 'GET');
}

export async function getPlaylist(playlistId: string) {
    return fetchWebApi(`playlists/${playlistId}`, 'GET');
}

export async function getPlaylistTracks(playlistId: string) {
    return fetchWebApi(`playlists/${playlistId}/tracks?limit=50`, 'GET');
}

// Recently Played
export async function getRecentlyPlayed() {
    return fetchWebApi('me/player/recently-played?limit=10', 'GET');
}

// Player State
export async function getPlayerState() {
    // Returns what is currently playing
    return fetchWebApi('me/player', 'GET');
}

// Playback Controls
export async function play(options?: { uris?: string[], context_uri?: string, offset?: { position: number } }) {
    return fetchWebApi('me/player/play', 'PUT', options);
}

export async function pause() {
    return fetchWebApi('me/player/pause', 'PUT');
}

export async function nextTrack() {
    return fetchWebApi('me/player/next', 'POST');
}

export async function previousTrack() {
    return fetchWebApi('me/player/previous', 'POST');
}

export async function seek(positionMs: number) {
    return fetchWebApi(`me/player/seek?position_ms=${positionMs}`, 'PUT');
}

export async function setVolume(volumePercent: number) {
    return fetchWebApi(`me/player/volume?volume_percent=${volumePercent}`, 'PUT');
}

export async function setShuffle(state: boolean) {
    return fetchWebApi(`me/player/shuffle?state=${state}`, 'PUT');
}

export async function setRepeatMode(state: 'track' | 'context' | 'off') {
    return fetchWebApi(`me/player/repeat?state=${state}`, 'PUT');
}

// Devices
export async function getDevices() {
    return fetchWebApi('me/player/devices', 'GET');
}

export async function transferPlayback(deviceId: string, play: boolean = false) {
    return fetchWebApi('me/player', 'PUT', { device_ids: [deviceId], play });
}

// Saved Tracks (Liked Songs)
export async function getSavedTracks() {
    return fetchWebApi('me/tracks?limit=50', 'GET');
}

// Search
export async function search(query: string, types: string[] = ['track', 'album', 'artist', 'playlist'], limit: number = 20) {
    if (!query) return null;
    const typeStr = types.join(',');
    const encodedQuery = encodeURIComponent(query);
    return fetchWebApi(`search?q=${encodedQuery}&type=${typeStr}&limit=${limit}`, 'GET');
}
