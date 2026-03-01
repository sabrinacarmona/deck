import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getPlayerState, play as apiPlay, pause as apiPause, nextTrack, previousTrack, seek as apiSeek, getDevices, transferPlayback, setVolume as apiSetVolume, setShuffle as apiSetShuffle, setRepeatMode as apiSetRepeat } from '../api/spotify';
import { getToken } from '../api/auth';
import { register, unregisterAll, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { SpotifyTrack, SpotifyDevice } from '../types/spotify';

export interface PlayerState {
    isPlaying: boolean;
    progressMs: number;
    currentTrack: SpotifyTrack | null; // The track object
    durationMs: number;
    activeDevice: SpotifyDevice | null;
    devices: SpotifyDevice[];
    shuffleState: boolean;
    repeatState: string; // 'track' | 'context' | 'off'
    error: string | null;
}

interface PlayerContextType {
    isPlaying: boolean;
    currentTrack: SpotifyTrack | null;
    progressMs: number;
    durationMs: number;
    devices: SpotifyDevice[];
    activeDevice: SpotifyDevice | null;
    shuffleState: boolean;
    repeatState: string;
    error: string | null;
    play: (options?: { uris?: string[], context_uri?: string, offset?: { position: number } }) => Promise<void>;
    togglePlay: () => Promise<void>;
    skipNext: () => Promise<void>;
    skipPrevious: () => Promise<void>;
    seekTo: (positionMs: number) => Promise<void>;
    setVolumeLevel: (volumePercent: number) => Promise<void>;
    toggleShuffle: () => Promise<void>;
    toggleRepeat: () => Promise<void>;
    transferDevice: (deviceId: string) => Promise<void>;
    refreshDevices: () => Promise<void>;
    clearError: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progressMs, setProgressMs] = useState(0);
    const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
    const [durationMs, setDurationMs] = useState(0);
    const [activeDevice, setActiveDevice] = useState<SpotifyDevice | null>(null);
    const [devices, setDevices] = useState<SpotifyDevice[]>([]);
    const [shuffleState, setShuffleState] = useState(false);
    const [repeatState, setRepeatState] = useState('off');
    const [error, setError] = useState<string | null>(null);

    const clearError = () => setError(null);

    // Use a ref to track if we should continue polling
    const pollingRef = useRef<boolean>(true);

    const refreshDevices = useCallback(async () => {
        if (!getToken()) return;
        try {
            const data = await getDevices();
            if (data && data.devices && pollingRef.current) {
                setDevices(data.devices);
            }
        } catch (e: unknown) {
            console.error("Failed to fetch devices", e);
            setError(e instanceof Error ? e.message : "Failed to fetch devices");
        }
    }, []);

    const refreshState = useCallback(async () => {
        if (!getToken()) return;
        try {
            const data = await getPlayerState();
            if (data && pollingRef.current) {
                setIsPlaying(data.is_playing || false);
                setProgressMs(data.progress_ms || 0);
                setCurrentTrack(data.item || null);
                setDurationMs(data.item?.duration_ms || 0);
                setActiveDevice(data.device || null);
                setShuffleState(data.shuffle_state || false);
                setRepeatState(data.repeat_state || 'off');
            } else if (!data && pollingRef.current) {
                // If nothing is playing or API returns 204
                setIsPlaying(false);
                setCurrentTrack(null);
                setProgressMs(0);
                setDurationMs(0);
            }

            // Periodically refresh devices too
            refreshDevices();
        } catch (e: unknown) {
            console.error("Failed to fetch player state", e);
            setError(e instanceof Error ? e.message : "Failed to fetch player state");
        }
    }, [refreshDevices]);

    // Start polling when provider mounts
    useEffect(() => {
        pollingRef.current = true;

        // Initial fetch
        refreshState();

        // Poll every 1.5 seconds for snappier UI
        const interval = setInterval(refreshState, 1500);

        return () => {
            pollingRef.current = false;
            clearInterval(interval);
        };
    }, [refreshState]);

    // Setup Media Key Global Shortcuts
    useEffect(() => {
        const setupShortcuts = async () => {
            try {
                const shortcuts = ['MediaPlayPause', 'MediaNextTrack', 'MediaPreviousTrack'];

                // Clear any existing registrations first
                await unregisterAll();

                for (const shortcut of shortcuts) {
                    const isReg = await isRegistered(shortcut);
                    if (!isReg) {
                        try {
                            await register(shortcut, (e) => {
                                if (e.state === "Pressed") {
                                    if (e.shortcut === 'MediaPlayPause') {
                                        handleTogglePlay();
                                    } else if (e.shortcut === 'MediaNextTrack') {
                                        handleSkipNext();
                                    } else if (e.shortcut === 'MediaPreviousTrack') {
                                        handleSkipPrevious();
                                    }
                                }
                            });
                        } catch (err) {
                            console.log(`Shortcut ${shortcut} registration skipped or failed`, err);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to setup global shortcuts:", err);
            }
        };

        setupShortcuts();

        return () => {
            unregisterAll().catch(console.error);
        };
    }, []);

    const handlePlay = async (options?: { uris?: string[], context_uri?: string, offset?: { position: number } }) => {
        try {
            setIsPlaying(true); // Optimistic UI update
            await apiPlay(options);
            setTimeout(refreshState, 500);
            clearError();
        } catch (err: unknown) {
            console.error("Play failed", err);
            setError(err instanceof Error ? err.message : 'Failed to play track');
            setIsPlaying(false); // Revert on failure
            refreshState();
        }
    };

    const handleTogglePlay = async () => {
        try {
            if (isPlaying) {
                setIsPlaying(false); // Optimistic UI update
                await apiPause();
            } else {
                setIsPlaying(true); // Optimistic UI update
                await apiPlay();
            }
            setTimeout(refreshState, 500);
            clearError();
        } catch (err: unknown) {
            console.error("Toggle playback failed", err);
            setError(err instanceof Error ? err.message : 'Failed to toggle playback');
            refreshState(); // Revert on failure
        }
    };

    const handleSkipNext = async () => {
        try {
            await nextTrack();
            setTimeout(refreshState, 500);
            clearError();
        } catch (err: unknown) {
            console.error("Skip next failed", err);
            setError(err instanceof Error ? err.message : 'Failed to skip track');
        }
    };

    const handleSkipPrevious = async () => {
        try {
            await previousTrack();
            setTimeout(refreshState, 500);
            clearError();
        } catch (err: unknown) {
            console.error("Skip previous failed", err);
            setError(err instanceof Error ? err.message : 'Failed to skip track');
        }
    };

    const handleSeekTo = async (positionMs: number) => {
        try {
            setProgressMs(positionMs); // Optimistic UI
            await apiSeek(positionMs);
            setTimeout(refreshState, 500);
            clearError();
        } catch (err: unknown) {
            console.error("Seek failed", err);
            setError(err instanceof Error ? err.message : 'Failed to seek');
            refreshState(); // Revert on failure
        }
    };

    const handleSetVolume = async (volumePercent: number) => {
        try {
            setActiveDevice((prev) => prev ? { ...prev, volume_percent: volumePercent } : null); // Optimistic UI
            await apiSetVolume(volumePercent);
            clearError();
        } catch (err: unknown) {
            console.error("Set volume failed", err);
            setError(err instanceof Error ? err.message : 'Failed to set volume');
            refreshState(); // Revert on failure
        }
    };

    const handleToggleShuffle = async () => {
        try {
            const newState = !shuffleState;
            setShuffleState(newState); // Optimistic UI
            await apiSetShuffle(newState);
            clearError();
        } catch (err: unknown) {
            console.error("Toggle shuffle failed", err);
            setError(err instanceof Error ? err.message : 'Failed to set shuffle');
            refreshState(); // Revert on failure
        }
    };

    const handleToggleRepeat = async () => {
        try {
            const nextMode = repeatState === 'off' ? 'context' : repeatState === 'context' ? 'track' : 'off';
            setRepeatState(nextMode); // Optimistic UI
            await apiSetRepeat(nextMode as 'track' | 'context' | 'off');
            clearError();
        } catch (err: unknown) {
            console.error("Toggle repeat failed", err);
            setError(err instanceof Error ? err.message : 'Failed to set repeat mode');
            refreshState(); // Revert on failure
        }
    };

    const handleTransferDevice = async (deviceId: string) => {
        try {
            await transferPlayback(deviceId, isPlaying);
            setTimeout(() => { refreshState(); refreshDevices(); }, 500);
            clearError();
        } catch (err: unknown) {
            console.error("Transfer device failed", err);
            setError(err instanceof Error ? err.message : 'Failed to transfer playback');
        }
    };

    return (
        <PlayerContext.Provider value={{
            isPlaying,
            currentTrack,
            progressMs,
            durationMs,
            devices,
            activeDevice,
            shuffleState,
            repeatState,
            error,
            play: handlePlay,
            togglePlay: handleTogglePlay,
            skipNext: handleSkipNext,
            skipPrevious: handleSkipPrevious,
            seekTo: handleSeekTo,
            setVolumeLevel: handleSetVolume,
            toggleShuffle: handleToggleShuffle,
            toggleRepeat: handleToggleRepeat,
            transferDevice: handleTransferDevice,
            refreshDevices,
            clearError
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error("usePlayer must be used within a PlayerProvider");
    }
    return context;
};
