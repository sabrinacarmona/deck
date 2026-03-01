import { useEffect, useState, useRef, useCallback } from 'react';
import { Home, Search, Library, ChevronDown, ChevronRight, Loader2, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserPlaylists, fetchAbsoluteWebApi } from '../api/spotify';
import './Sidebar.css';

interface SidebarProps {
    onSearchClick: () => void;
}

interface Playlist {
    id: string;
    name: string;
}

export function Sidebar({ onSearchClick }: SidebarProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLibraryOpen, setIsLibraryOpen] = useState(true);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let mounted = true;
        setIsLoading(true);
        getUserPlaylists()
            .then(data => {
                if (mounted && data?.items) {
                    setPlaylists(data.items);
                    setNextUrl(data.next);
                }
            })
            .catch(console.error)
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastPlaylistElementRef = useCallback((node: HTMLButtonElement | null) => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && nextUrl) {
                // Fetch next page
                setIsLoading(true);
                fetchAbsoluteWebApi(nextUrl)
                    .then(data => {
                        if (data?.items) {
                            setPlaylists(prev => [...prev, ...data.items]);
                            setNextUrl(data.next || null);
                        }
                    })
                    .catch(console.error)
                    .finally(() => setIsLoading(false));
            }
        });

        if (node) observer.current.observe(node);
    }, [isLoading, nextUrl]);

    return (
        <nav className="sidebar">
            <div className="sidebar-nav">
                <button
                    className={`nav-item nav-btn ${location.pathname === '/' ? 'active' : ''}`}
                    onClick={() => navigate('/')}
                >
                    <Home size={24} strokeWidth={1.5} />
                    <span>Home</span>
                </button>
                <button className="nav-item nav-btn" onClick={onSearchClick}>
                    <Search size={24} strokeWidth={1.5} />
                    <span>Search</span>
                </button>
                <button
                    className="nav-item nav-btn library-toggle"
                    onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Library size={24} strokeWidth={1.5} />
                        <span>Your Library</span>
                    </div>
                    {isLibraryOpen ? <ChevronDown size={16} className="chevron" /> : <ChevronRight size={16} className="chevron" />}
                </button>
            </div>

            {isLibraryOpen && (
                <div className="sidebar-library">
                    <div className="playlist-list">
                        <button
                            className={`playlist-item ${location.pathname === '/liked-songs' ? 'active' : ''}`}
                            onClick={() => navigate('/liked-songs')}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}
                        >
                            <div style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)', width: '24px', height: '24px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Heart fill="white" size={12} strokeWidth={0} />
                            </div>
                            <span style={{ fontWeight: 600 }}>Liked Songs</span>
                        </button>

                        {playlists.map((p, index) => {
                            const isLastItem = index === playlists.length - 1;
                            return (
                                <button
                                    ref={isLastItem ? lastPlaylistElementRef : null}
                                    key={p.id}
                                    className={`playlist-item ${location.pathname === `/playlist/${p.id}` ? 'active' : ''}`}
                                    onClick={() => navigate(`/playlist/${p.id}`)}
                                >
                                    {p.name}
                                </button>
                            );
                        })}
                        {isLoading && playlists.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
                                <Loader2 size={16} className="spinner" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
