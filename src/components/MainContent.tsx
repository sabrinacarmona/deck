import { useEffect, useState } from 'react';
import { getRecentlyPlayed } from '../api/spotify';
import './MainContent.css';

interface Track {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
        images: { url: string }[];
    };
}

export function MainContent() {
    const [recentTracks, setRecentTracks] = useState<Track[]>([]);

    useEffect(() => {
        let mounted = true;
        getRecentlyPlayed()
            .then(data => {
                if (mounted && data?.items) {
                    // Extract track info, ensuring we show unique items
                    const tracks: Track[] = data.items.map((item: any) => item.track);
                    // De-duplicate tracks based on id
                    const uniqueTracks = Array.from(new Map(tracks.map(t => [t.id, t])).values());

                    setRecentTracks(uniqueTracks);
                }
            })
            .catch(console.error);

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <main className="main-content">
            <header className="main-header">
                <div className="greeting">Good evening</div>
            </header>

            <section className="content-section">
                <h2 className="section-title">Recently Played</h2>
                <div className="grid-container">
                    {recentTracks.map((track, i) => (
                        <div key={`${track.id}-${i}`} className="album-card">
                            <div className="album-artwork">
                                {track.album.images?.[0]?.url && (
                                    <img
                                        src={track.album.images[0].url}
                                        alt={track.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                    />
                                )}
                            </div>
                            <div className="album-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.name}</div>
                            <div className="album-artist" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {track.artists.map(a => a.name).join(', ')}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
