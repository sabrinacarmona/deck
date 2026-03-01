import { Loader2 } from 'lucide-react';
import { SpotifyTrack } from '../types/spotify';
import { usePlayer } from '../contexts/PlayerContext';

interface TrackItem {
    added_at?: string;
    track: SpotifyTrack | null;
}

interface TrackListProps {
    items?: TrackItem[];
    contextUri?: string;
    isLoadingMore?: boolean;
    lastItemRef?: (node: HTMLDivElement | null) => void;
}

export function TrackList({ items, contextUri, isLoadingMore, lastItemRef }: TrackListProps) {
    const { play } = usePlayer();

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor((ms || 0) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="track-list">
            <div className="tracks-header" style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 60px',
                padding: '8px 16px',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                <div className="col-index">#</div>
                <div className="col-title">Title</div>
                <div className="col-time" style={{ textAlign: 'right' }}>Time</div>
            </div>

            {items.map((item, index) => {
                if (!item?.track) {
                    return (
                        <div key={`err-${index}`} style={{ padding: '8px 16px', color: '#ff6b6b', fontSize: '11px', overflow: 'hidden' }}>
                            [Debug Null Track] {JSON.stringify(item).substring(0, 150)}
                        </div>
                    );
                }

                const isLastItem = index === items.length - 1;

                return (
                    <div
                        ref={isLastItem ? lastItemRef : null}
                        key={`${item.track.id || index}-${index}`}
                        className="track-row"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1fr 60px',
                            padding: '8px 16px',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderRadius: '4px'
                        }}
                        onClick={() => {
                            if (contextUri && item.track?.uri) {
                                play({ context_uri: contextUri, offset: { uri: item.track.uri } as any });
                            } else if (item.track?.uri) {
                                play({ uris: [item.track.uri] });
                            }
                        }}
                    >
                        <div className="col-index" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            {index + 1}
                        </div>
                        <div className="col-title" style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                            <span className="track-name" style={{ color: 'var(--text-primary)', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.track.name || 'Unknown Track'}
                            </span>
                            <span className="track-artists" style={{ color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.track.artists?.map(a => a.name).join(', ') || 'Unknown Artist'}
                            </span>
                        </div>
                        <div className="col-time" style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'right' }}>
                            {formatTime(item.track.duration_ms)}
                        </div>
                    </div>
                );
            })}

            {isLoadingMore && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                    <Loader2 size={24} className="spinner" style={{ color: 'var(--text-secondary)' }} />
                </div>
            )}
        </div>
    );
}
