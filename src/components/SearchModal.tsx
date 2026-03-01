import { Search, X } from 'lucide-react';
import './SearchModal.css';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
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
                        autoFocus
                    />
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} strokeWidth={1.5} />
                    </button>
                </div>
                <div className="search-results">
                    {/* Placeholder for results */}
                    <div className="search-placeholder">
                        <span className="placeholder-text">Recent searches</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
