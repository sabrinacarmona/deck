import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { redirectToSpotify } from '../api/auth';
import './Login.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = () => {
        setLoading(true);
        setError(null);
        redirectToSpotify(
            () => {
                // Success callback
                setLoading(false);
                navigate('/', { replace: true });
            },
            (err) => {
                // Error callback
                setLoading(false);
                setError(err);
            }
        );
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <h1>Deck</h1>
                <p>A minimalist, distraction-free desktop music player.</p>

                {error && <p className="error-message" style={{ color: '#ff4444', marginBottom: '1rem' }}>{error}</p>}

                <button
                    onClick={handleLogin}
                    className="login-button"
                    disabled={loading}
                >
                    {loading ? 'Waiting for authentication...' : 'Connect to Spotify'}
                </button>
            </div>
        </div>
    );
};

export default Login;
