import './MainContent.css';

export function MainContent() {
    return (
        <main className="main-content">
            <header className="main-header">
                <div className="greeting">Good evening</div>
            </header>

            <section className="content-section">
                <h2 className="section-title">Recently Played</h2>
                <div className="grid-container">
                    <div className="album-card">
                        <div className="album-artwork"></div>
                        <div className="album-title">Midnight Sounds</div>
                        <div className="album-artist">Various Artists</div>
                    </div>
                    <div className="album-card">
                        <div className="album-artwork"></div>
                        <div className="album-title">Focus Flow</div>
                        <div className="album-artist">Minimal Beats</div>
                    </div>
                </div>
            </section>
        </main>
    );
}
