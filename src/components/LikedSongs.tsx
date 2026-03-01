import { useEffect, useState, useRef } from 'react';
import { getSavedTracks, fetchAbsoluteWebApi } from '../api/spotify';
import { usePlayer } from '../contexts/PlayerContext';
import { Clock, Play, Loader2 } from 'lucide-react';
import './PlaylistView.css'; // We can reuse the playlist view styles

// Helper to format ms to m:ss
function formatDuration(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
}

// Format date added
function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function LikedSongs() {
    const { play } = usePlayer();
    const [tracks, setTracks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalTracks, setTotalTracks] = useState(0);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const observerTarget = useRef(null);

    useEffect(() => {
        const fetchInitialTracks = async () => {
            setIsLoading(true);
            try {
                const data = await getSavedTracks();
                if (data) {
                    setTracks(data.items);
                    setNextUrl(data.next);
                    setTotalTracks(data.total);
                }
            } catch (err) {
                console.error("Failed to load liked songs", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialTracks();
    }, []);

    // Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && nextUrl && !isLoading) {
                    fetchMoreTracks();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [nextUrl, isLoading]);

    const fetchMoreTracks = async () => {
        if (!nextUrl) return;
        setIsLoading(true);
        try {
            const data = await fetchAbsoluteWebApi(nextUrl);
            if (data) {
                setTracks(prev => [...prev, ...data.items]);
                setNextUrl(data.next);
            }
        } catch (err) {
            console.error("Failed to fetch more liked songs", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayPlaylist = () => {
        // Liked songs acts differently than a standard playlist.
        // It doesn't have a single context URI, so we pass an array of track URIs
        if (tracks.length > 0) {
            const uris = tracks.map(t => t.track.uri);
            play({ uris });
        }
    };

    const handlePlayTrack = (trackUri: string, index: number) => {
        // Play the track, providing surrounding URIs for context if possible
        const uris = tracks.slice(index, index + 50).map(t => t.track.uri);
        play({ uris: uris.length > 0 ? uris : [trackUri] });
    };

    if (isLoading && tracks.length === 0) {
        return (
            <div className="view-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Loader2 size={32} className="search-spinner" />
            </div>
        );
    }

    return (
        <div className="view-container playlist-view">
            <div className="playlist-header">
                <div className="playlist-cover liked-songs-cover">
                    <div style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg role="img" height="64" width="64" viewBox="0 0 24 24" fill="white"><path d="M5.21 1.57a6.757 6.757 0 0 1 6.708 1.545.124.124 0 0 0 .165 0 6.741 6.741 0 0 1 5.715-1.78l.004.001a6.802 6.802 0 0 1 5.571 5.376v.003a6.689 6.689 0 0 1-1.49 5.655l-7.954 9.48a.25.25 0 0 1-.384 0l-7.944-9.47A6.688 6.688 0 0 1 4.11 6.715a6.804 6.804 0 0 1 1.1-5.145zm.824 1.156a5.304 5.304 0 0 0-.858 4.01 5.188 5.188 0 0 0 1.166 4.407L12 18.254l5.658-6.753A5.187 5.187 0 0 0 18.825 7.1a5.303 5.303 0 0 0-4.341-4.187 5.242 5.242 0 0 0-4.444 1.383 1.624 1.624 0 0 1-2.08 0 5.258 5.258 0 0 0-1.926-.54V1.5z"></path></svg>
                    </div>
                </div>
                <div className="playlist-info text-shadow-overlay">
                    <span className="playlist-type">Playlist</span>
                    <h1 className="playlist-title">Liked Songs</h1>
                    <p className="playlist-description">Your saved tracks</p>
                    <div className="playlist-meta">
                        <span className="owner">You</span>
                        <span className="dot">•</span>
                        <span>{totalTracks} songs</span>
                    </div>
                </div>
            </div>

            <div className="playlist-actions">
                <button className="play-button" onClick={handlePlayPlaylist} disabled={tracks.length === 0}>
                    <Play size={24} fill="currentColor" className="play-icon" />
                </button>
            </div>

            <div className="tracks-list">
                <div className="tracks-header">
                    <div className="col-hash">#</div>
                    <div className="col-title">Title</div>
                    <div className="col-album">Album</div>
                    <div className="col-date">Date added</div>
                    <div className="col-time"><Clock size={16} /></div>
                </div>

                {tracks.map((item, index) => {
                    const track = item.track;
                    if (!track) return null; // Defensive check

                    return (
                        <div
                            className="track-row"
                            key={`${track.id}-${index}`}
                            onClick={() => handlePlayTrack(track.uri, index)}
                        >
                            <div className="col-hash">{index + 1}</div>
                            <div className="col-title track-title-col">
                                {track.album?.images?.[0] && (
                                    <img src={track.album.images[0].url} alt="" className="track-img" />
                                )}
                                <div className="track-name-artist">
                                    <span className="track-name">{track.name}</span>
                                    <span className="track-artist">{track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist'}</span>
                                </div>
                            </div>
                            <div className="col-album">{track.album?.name || 'Unknown Album'}</div>
                            <div className="col-date">{formatDate(item.added_at)}</div>
                            <div className="col-time">{formatDuration(track.duration_ms)}</div>
                        </div>
                    );
                })}

                {/* Loading Indicator for Infinite Scroll */}
                <div ref={observerTarget} style={{ height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '16px' }}>
                    {isLoading && tracks.length > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading more...</span>}
                </div>
            </div>
        </div>
    );
}
