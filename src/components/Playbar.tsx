import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Repeat, Shuffle, MonitorSpeaker, Volume2, VolumeX } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import './Playbar.css';

// Helper to format ms to mm:ss
function formatTime(ms: number) {
    if (!ms) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function Playbar() {
    const { isPlaying, progressMs, currentTrack: item, togglePlay, skipNext, skipPrevious, seekTo, setVolumeLevel, toggleShuffle, toggleRepeat, shuffleState, repeatState, devices, activeDevice: device, transferDevice } = usePlayer();

    const [isDragging, setIsDragging] = useState(false);
    const [localProgress, setLocalProgress] = useState(0);
    const [showDevices, setShowDevices] = useState(false);

    useEffect(() => {
        if (!isDragging) {
            setLocalProgress(progressMs);
        }
    }, [progressMs, isDragging]);

    const trackName = item?.name || 'No Track Selected';
    const artistName = item?.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist';
    const durationMs = item?.duration_ms || 1; // avoid division by zero

    const currentProgress = isDragging ? localProgress : progressMs;
    const progressPercent = Math.min((currentProgress / durationMs) * 100, 100);
    const volumePercent = device?.volume_percent ?? 50;

    return (
        <div className="playbar">
            <div className="playbar-track-info">
                {item?.album?.images?.[0]?.url && (
                    <img
                        src={item.album.images[0].url}
                        alt="Album art"
                        style={{ width: 48, height: 48, borderRadius: 4, marginRight: 12, objectFit: 'cover' }}
                    />
                )}
                <div>
                    <div className="track-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{trackName}</div>
                    <div className="track-artist" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{artistName}</div>
                </div>
            </div>

            <div className="playbar-controls">
                <div className="control-buttons">
                    <button
                        className={`control-btn subtle ${shuffleState ? 'active-green' : ''}`}
                        onClick={() => toggleShuffle()}
                    >
                        <Shuffle size={18} strokeWidth={1.5} />
                    </button>

                    <button className="control-btn" onClick={() => skipPrevious()} disabled={!item}>
                        <SkipBack size={22} strokeWidth={1.5} fill="currentColor" />
                    </button>

                    {isPlaying ? (
                        <button className="control-btn play-pause" onClick={() => togglePlay()}>
                            <Pause size={20} strokeWidth={1.5} fill="currentColor" className="play-icon" />
                        </button>
                    ) : (
                        <button className="control-btn play-pause" onClick={() => togglePlay()} disabled={!item}>
                            <Play size={20} strokeWidth={1.5} fill="currentColor" className="play-icon" />
                        </button>
                    )}

                    <button className="control-btn" onClick={() => skipNext()} disabled={!item}>
                        <SkipForward size={22} strokeWidth={1.5} fill="currentColor" />
                    </button>

                    <button
                        className={`control-btn subtle ${repeatState !== 'off' ? 'active-green' : ''}`}
                        onClick={() => toggleRepeat()}
                    >
                        <Repeat size={18} strokeWidth={1.5} />
                        {repeatState === 'track' && <span className="repeat-badge">1</span>}
                    </button>
                </div>
                <div className="progress-bar-container">
                    <span className="time">{formatTime(currentProgress)}</span>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                        <input
                            type="range"
                            className="progress-slider"
                            min="0"
                            max={durationMs}
                            value={currentProgress}
                            onChange={(e) => {
                                setIsDragging(true);
                                setLocalProgress(Number(e.target.value));
                            }}
                            onMouseUp={(e) => {
                                seekTo(Number((e.target as HTMLInputElement).value));
                                setIsDragging(false);
                            }}
                            onTouchEnd={(e) => {
                                seekTo(Number((e.target as HTMLInputElement).value));
                                setIsDragging(false);
                            }}
                        />
                    </div>
                    <span className="time">{formatTime(durationMs)}</span>
                </div>
            </div>

            <div className="playbar-extra">
                <div className="volume-container">
                    <button className="control-btn subtle" onClick={() => setVolumeLevel(volumePercent === 0 ? 50 : 0)}>
                        {volumePercent === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <div className="volume-bar-bg">
                        <div className="volume-bar-fill" style={{ width: `${volumePercent}%` }}></div>
                        <input
                            type="range"
                            className="volume-slider"
                            min="0"
                            max="100"
                            value={volumePercent}
                            onChange={(e) => setVolumeLevel(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="device-picker-container">
                    <button
                        className={`control-btn ${device ? 'active-green' : 'subtle'}`}
                        onClick={() => setShowDevices(!showDevices)}
                    >
                        <MonitorSpeaker size={18} />
                    </button>

                    {showDevices && (
                        <div className="device-popover">
                            <div className="device-popover-header">Connect to a device</div>
                            {devices.length === 0 ? (
                                <div className="device-item empty">No devices found</div>
                            ) : (
                                devices.map(d => (
                                    <div
                                        key={d.id}
                                        className={`device-item ${d.is_active ? 'active' : ''}`}
                                        onClick={() => {
                                            transferDevice(d.id);
                                            setShowDevices(false);
                                        }}
                                    >
                                        <MonitorSpeaker size={16} />
                                        <span>{d.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
