import { getToken, logout } from './auth';

async function fetchWebApi(endpoint: string, method: string, body?: any) {
    const token = getToken();
    if (!token) throw new Error('No access token');

    const res = await fetch(`https://api.spotify.com/v1/${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method,
        body: body ? JSON.stringify(body) : undefined
    });

    if (res.status === 401) {
        logout();
        throw new Error('Token expired');
    }

    if (res.status === 204) return null; // No content (e.g., play/pause success)

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
export async function play() {
    return fetchWebApi('me/player/play', 'PUT');
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
