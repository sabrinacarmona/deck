import { start, onUrl, cancel } from '@fabianlars/tauri-plugin-oauth';
import { openUrl } from '@tauri-apps/plugin-opener';

export const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;

const generateRandomString = (length: number) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = window.crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

const sha256 = async (plain: string) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input: ArrayBuffer) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export async function redirectToSpotify(
    onSuccess: () => void,
    onError: (err: string) => void
) {
    try {
        if (!SPOTIFY_CLIENT_ID) {
            throw new Error("Missing VITE_SPOTIFY_CLIENT_ID in .env file.");
        }

        const port = await start({ ports: [1421], response: "You can close this window now and return to Deck." });
        const redirectUri = `http://127.0.0.1:${port}`;

        const codeVerifier = generateRandomString(64);
        window.localStorage.setItem('code_verifier', codeVerifier);
        const hashed = await sha256(codeVerifier);
        const codeChallenge = base64encode(hashed);

        const scope = [
            'user-read-private',
            'user-read-email',
            'user-library-read',
            'playlist-read-private',
            'user-modify-playback-state',
            'user-read-playback-state',
            'user-read-currently-playing',
            'streaming'
        ].join(' ');

        const authUrl = new URL("https://accounts.spotify.com/authorize");
        const params = {
            response_type: 'code',
            client_id: SPOTIFY_CLIENT_ID,
            scope,
            code_challenge_method: 'S256',
            code_challenge: codeChallenge,
            redirect_uri: redirectUri,
        };

        authUrl.search = new URLSearchParams(params).toString();

        await onUrl(async (url) => {
            try {
                const urlParams = new URLSearchParams(url.split('?')[1]);
                if (urlParams.has('error')) {
                    throw new Error(urlParams.get('error') || 'Unknown error from Spotify');
                }
                const code = urlParams.get('code');
                if (!code) throw new Error("No authorization code received.");

                const success = await exchangeCodeForToken(code, redirectUri);
                if (success) {
                    onSuccess();
                } else {
                    onError("Failed to exchange token.");
                }
            } catch (err: any) {
                onError(err.message || String(err));
            } finally {
                cancel(port).catch(console.error);
            }
        });

        await openUrl(authUrl.toString());

    } catch (err: any) {
        onError(err.message || String(err));
    }
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<boolean> {
    const codeVerifier = window.localStorage.getItem('code_verifier');
    if (!codeVerifier) return false;

    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: SPOTIFY_CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier,
        }),
    };

    try {
        const res = await fetch("https://accounts.spotify.com/api/token", payload);
        const response = await res.json();
        if (response.access_token) {
            window.localStorage.setItem('access_token', response.access_token);
            window.localStorage.setItem('refresh_token', response.refresh_token);
            return true;
        }
    } catch (e) {
        console.error("Token exchange failed", e);
    }
    return false;
}

export function getToken(): string | null {
    return window.localStorage.getItem('access_token');
}

export function logout() {
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    window.localStorage.removeItem('code_verifier');
    window.location.href = '/';
}
