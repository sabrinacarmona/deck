import { Home, Search, Library } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
    onSearchClick: () => void;
}

export function Sidebar({ onSearchClick }: SidebarProps) {
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
                    <div className="playlist-item">Liked Songs</div>
                    <div className="playlist-item">Focus Mix</div>
                    <div className="playlist-item">Discover Weekly</div>
                    <div className="playlist-item">Midnight Drive</div>
                </div>
            </div>
        </nav>
    );
}
