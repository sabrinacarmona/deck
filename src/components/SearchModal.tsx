import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { search, fetchAbsoluteWebApi } from '../api/spotify';
import { usePlayer } from '../contexts/PlayerContext';
import { SpotifyTrack, SpotifyArtist } from '../types/spotify';
import debounce from 'lodash.debounce';
import './SearchModal.css';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const { play } = usePlayer();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SpotifyTrack[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const observerTarget = useRef(null);

    // Debounced search function
    const performSearch = useCallback(
        debounce(async (q: string) => {
            if (!q.trim()) {
                setResults([]);
                setNextUrl(null);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Focus on tracks for now for a streamlined player experience
                const data = await search(q, ['track'], 50);
                if (data && data.tracks) {
                    setResults(data.tracks.items);
                    setNextUrl(data.tracks.next);
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsLoading(false);
            }
        }, 500),
        []
    );

    // Trigger search when query changes
    useEffect(() => {
        performSearch(query);
    }, [query, performSearch]);

    // Handle Infinite Scroll for search results
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && nextUrl && !isLoading) {
                    fetchMoreResults();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [nextUrl, isLoading]);

    const fetchMoreResults = async () => {
        if (!nextUrl) return;
        setIsLoading(true);
        try {
            const data = await fetchAbsoluteWebApi(nextUrl);
            if (data && data.tracks) {
                setResults(prev => [...prev, ...data.tracks.items]);
                setNextUrl(data.tracks.next);
            }
        } catch (err) {
            console.error("Failed to fetch more search results", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            // Reset state on open if previously closed
            if (!query) {
                setResults([]);
                setNextUrl(null);
            }
        } else {
            // Optional: clear search on close
            // setQuery('');
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-modal" onClick={e => e.stopPropagation()}>
                <div className="search-input-container">
                    <Search size={24} className="search-icon" strokeWidth={1.5} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button className="close-btn" onClick={() => {
                        setQuery('');
                        setResults([]);
                        setNextUrl(null);
                        if (!query) onClose(); // If already empty, close modal
                    }}>
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>
                <div className="search-results">
                    {query.trim() === '' ? (
                        <div className="search-placeholder">
                            <span className="placeholder-text">Start typing to search for songs...</span>
                        </div>
                    ) : (
                        <div className="search-tracks-list">
                            {results.map((track) => (
                                <div
                                    key={track.id}
                                    className="search-track-row"
                                    onClick={() => {
                                        play({ uris: [track.uri] });
                                        onClose(); // Optional: close search when playing a track
                                    }}
                                >
                                    {track.album?.images?.[0] && (
                                        <img src={track.album.images[0].url} alt={track.album.name} className="search-track-img" />
                                    )}
                                    <div className="search-track-info">
                                        <div className="search-track-title">{track.name}</div>
                                        <div className="search-track-artist">{track.artists?.map((a: SpotifyArtist) => a.name).join(', ')}</div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                    <Loader2 size={24} className="search-spinner" />
                                </div>
                            )}

                            {/* Intersection Observer Target */}
                            <div ref={observerTarget} style={{ height: '20px' }}></div>

                            {!isLoading && results.length === 0 && query.trim() !== '' && (
                                <div className="search-placeholder">
                                    <span className="placeholder-text">No results found for "{query}"</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
