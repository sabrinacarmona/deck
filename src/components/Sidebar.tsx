import { useEffect, useState } from 'react';
import { Home, Search, Library } from 'lucide-react';
import { getUserPlaylists } from '../api/spotify';
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

    useEffect(() => {
        let mounted = true;
        getUserPlaylists()
            .then(data => {
                if (mounted && data?.items) {
                    setPlaylists(data.items);
                }
            })
            .catch(console.error);

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <nav className="sidebar">
            <div className="sidebar-nav">
                <a href="#" className="nav-item">
                    <Home size={24} strokeWidth={1.5} />
                    <span>Home</span>
                </a>
                <button className="nav-item nav-btn" onClick={onSearchClick}>
                    <Search size={24} strokeWidth={1.5} />
                    <span>Search</span>
                </button>
                <a href="#" className="nav-item">
                    <Library size={24} strokeWidth={1.5} />
                    <span>Your Library</span>
                </a>
            </div>

            <div className="sidebar-library">
                <div className="playlist-list">
                    {playlists.map(p => (
                        <div key={p.id} className="playlist-item">{p.name}</div>
                    ))}
                </div>
            </div>
        </nav>
    );
}
