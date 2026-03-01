export interface SpotifyImage {
    url: string;
    height: number;
    width: number;
}

export interface SpotifyArtist {
    id: string;
    name: string;
    uri: string;
}

export interface SpotifyAlbum {
    id: string;
    name: string;
    images: SpotifyImage[];
    uri: string;
}

export interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
    duration_ms: number;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    is_playable?: boolean;
}

export interface SpotifyDevice {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    uri: string;
    images: SpotifyImage[];
    owner: {
        display_name: string;
    };
    tracks?: {
        href: string;
        total: number;
        items?: SpotifyPlaylistItem[];
        next?: string | null;
    };
    _error?: string;
}

export interface SpotifyPlaylistItem {
    added_at: string;
    track: SpotifyTrack | null;
}
