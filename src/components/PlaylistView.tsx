import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getPlaylist, getPlaylistTracks, fetchAbsoluteWebApi } from '../api/spotify';
import { TrackList } from './TrackList';
import { SpotifyTrack } from '../types/spotify';
import './PlaylistView.css';

interface PlaylistItem {
    added_at?: string;
    track: SpotifyTrack | null;
}

interface PlaylistData {
    id: string;
    name: string;
    description: string;
    uri: string;
    images: { url: string }[];
    tracks: {
        items: PlaylistItem[];
        next?: string;
    };
    owner: {
        display_name: string;
    };
    _error?: string;
}

export function PlaylistView() {
    const { id } = useParams<{ id: string }>();
    const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        if (!id) return;
        setIsLoading(true);
        let mounted = true;

        getPlaylist(id)
            .then(async data => {
                if (mounted) {
                    let finalData = { ...data };
                    // Fallback: If Spotify drops the tracks property on the playlist object
                    if (!data.tracks || !data.tracks.items) {
                        try {
                            const tracksData = await getPlaylistTracks(id);
                            finalData.tracks = tracksData;
                        } catch (e: any) {
                            console.error("Fallback track fetch failed", e);
                            finalData._error = e.message || String(e);
                        }
                    }

                    setPlaylist(finalData);
                    // The spotify api wraps tracks in a paging object
                    setNextUrl(finalData.tracks?.next || null);
                    setIsLoading(false);
                }
            })
            .catch(err => {
                console.error(err);
                if (mounted) setIsLoading(false);
            });

        return () => { mounted = false; };
    }, [id]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastTrackElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextUrl) {
                setIsLoadingMore(true);
                fetchAbsoluteWebApi(nextUrl)
                    .then(data => {
                        // For tracks paging object, data.items and data.next exist at top level
                        if (data && playlist) {
                            setPlaylist({
                                ...playlist,
                                tracks: {
                                    ...playlist.tracks,
                                    items: [...playlist.tracks.items, ...(data.items || [])]
                                }
                            });
                            setNextUrl(data.next || null);
                        }
                    })
                    .catch(console.error)
                    .finally(() => setIsLoadingMore(false));
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoadingMore, nextUrl, playlist]);

    if (isLoading) {
        return <div className="main-content"><div className="loading" style={{ color: 'var(--text-secondary)' }}>Loading...</div></div>;
    }

    if (!playlist) {
        return <div className="main-content"><div className="error" style={{ color: 'var(--text-secondary)' }}>Failed to load playlist</div></div>;
    }

    return (
        <div className="main-content playlist-view">
            <div className="playlist-header">
                {playlist.images?.[0] ? (
                    <img src={playlist.images[0].url} alt={playlist.name} className="playlist-cover" />
                ) : (
                    <div className="playlist-cover-placeholder"></div>
                )}
                <div className="playlist-info">
                    <span className="playlist-label">Playlist</span>
                    <h1 className="playlist-title">{playlist.name}</h1>
                    {playlist.description && <p className="playlist-description">{playlist.description}</p>}
                </div>
            </div>

            <div className="playlist-tracks">
                {(!playlist.tracks?.items || playlist.tracks.items.length === 0) ? (
                    <div style={{ padding: '32px', textAlign: 'left', color: '#ff6b6b', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'monospace', maxWidth: '600px', margin: '40px auto', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '8px' }}>
                        <h3 style={{ marginTop: 0, color: '#fff' }}>⚠️ Spotify API Error: {playlist._error || "Missing Tracks"}</h3>
                        <p style={{ color: '#ccc' }}>
                            Your Spotify Developer App is currently in <b>"Development Mode"</b>.
                        </p>
                        <p style={{ color: '#ccc' }}>
                            In Development Mode, Spotify blocks access to the track data of playlists created by other users to prevent data scraping.
                        </p>
                        <strong style={{ color: '#fff', display: 'block', marginTop: '16px' }}>How to fix this:</strong>
                        <ol style={{ paddingLeft: '20px', color: '#ccc', margin: '8px 0' }}>
                            <li style={{ marginBottom: '8px' }}>Go to your Spotify Developer Dashboard and request a quota extension to exit Development Mode.</li>
                            <li><b>OR:</b> Duplicate this playlist to your own Spotify account ("Add to profile"), and play your personal copy instead.</li>
                        </ol>

                        <details style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.5)' }}>
                            <summary style={{ cursor: 'pointer' }}>Show Raw API Response</summary>
                            <div style={{ marginTop: '8px', fontSize: '11px' }}>
                                {JSON.stringify(playlist, null, 2)}
                            </div>
                        </details>
                    </div>
                ) : (
                    <TrackList
                        items={playlist.tracks.items}
                        contextUri={playlist.uri}
                        isLoadingMore={isLoadingMore}
                        lastItemRef={lastTrackElementRef}
                    />
                )}
            </div>
        </div>
    );
}
