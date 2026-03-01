import { Play, SkipForward, SkipBack, Repeat, Shuffle } from 'lucide-react';
import './Playbar.css';

export function Playbar() {
    return (
        <div className="playbar">
            <div className="playbar-track-info">
                <div className="track-title">Focus Track</div>
                <div className="track-artist">Minimalist Artist</div>
            </div>

            <div className="playbar-controls">
                <div className="control-buttons">
                    <button className="control-btn subtle"><Shuffle size={18} strokeWidth={1.5} /></button>
                    <button className="control-btn"><SkipBack size={22} strokeWidth={1.5} fill="currentColor" /></button>
                    <button className="control-btn play-pause">
                        <Play size={20} strokeWidth={1.5} fill="currentColor" className="play-icon" />
                    </button>
                    <button className="control-btn"><SkipForward size={22} strokeWidth={1.5} fill="currentColor" /></button>
                    <button className="control-btn subtle"><Repeat size={18} strokeWidth={1.5} /></button>
                </div>
                <div className="progress-bar-container">
                    <span className="time">1:23</span>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: '30%' }}></div>
                    </div>
                    <span className="time">4:56</span>
                </div>
            </div>

            <div className="playbar-extra">
                {/* Extra controls (volume, queue) go here */}
            </div>
        </div>
    );
}
