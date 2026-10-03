import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import animationData from '../LottieFiles/App login.json';
import womanImg from '../assets/women with tab 1.png';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // const defaultOptions = {
    //     loop: true,
    //     autoplay: true,
    //     animationData: animationData,
    //     rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
    // };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await fetch('https://storekkb.mpdatahub.com/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate('/admin');
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            setError('Server error. Try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* ══════════════ LEFT PANEL ══════════════ */}
            <div className="login-left">
                <div className="login-form-wrapper">

                    <div className="login-lottie">

                        {/* <Lottie options={defaultOptions} height={110} width={110} /> */}
                        <Lottie animationData={animationData} loop={true} style={{ width: 110, height: 110 }} />
                        
                    </div>

                    <h1 className="login-title">LOGIN</h1>
                    <p className="login-subtitle">Welcome back! Please sign in to continue.</p>

                    {error && <div className="login-error">{error}</div>}

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <span className="input-icon">
                                    {/* <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg> */}
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email Address"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-icon-wrapper">
                                <span className="input-icon">
                                    {/* <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                    </svg> */}
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-submit-btn" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Login Now'}
                        </button>
                    </form>

                    {/* ── Social Login ── */}
                    {/* <div className="social-divider">
                        <span className="divider-line" />
                        <span className="divider-text"><strong>Login</strong> with Others</span>
                        <span className="divider-line" />
                    </div>

                    <button className="social-btn google-btn" type="button">
                        <svg width="20" height="20" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.1-6.1C34.46 3.1 29.5 1 24 1 14.82 1 7.07 6.48 3.69 14.22l7.14 5.55C12.6 13.39 17.84 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.1 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.58C43.09 37.3 46.1 31.36 46.1 24.5z"/>
                            <path fill="#FBBC05" d="M10.83 28.23A14.6 14.6 0 0 1 9.5 24c0-1.47.25-2.89.69-4.23L3.05 14.22A22.96 22.96 0 0 0 1 24c0 3.69.88 7.18 2.44 10.28l7.39-6.05z"/>
                            <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.95l-7.19-5.58c-1.99 1.34-4.54 2.13-6.31 2.13-6.16 0-11.4-3.89-13.17-9.37l-7.39 6.05C7.07 41.52 14.82 47 24 47z"/>
                        </svg>
                        Login with <strong>google</strong>
                    </button>

                    <button className="social-btn facebook-btn" type="button">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                        </svg>
                        Login with <strong>Facebook</strong>
                    </button> */}

                </div>
            </div>

            {/* ══════════════ RIGHT PANEL ══════════════ */}
            <div className="login-right">

                {/* Wavy SVG background */}
                <svg className="right-wavy-bg" viewBox="0 0 700 700" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                    <ellipse cx="620" cy="120" rx="320" ry="220" fill="rgba(255,255,255,0.07)" />
                    <ellipse cx="80" cy="600" rx="280" ry="200" fill="rgba(255,255,255,0.06)" />
                    <ellipse cx="350" cy="350" rx="500" ry="180" fill="rgba(255,255,255,0.04)" />
                </svg>

                {/* Inner promo area */}
                <div className="promo-content">

                    {/* Card — girl overflows out of the top-right */}
                    <div className="promo-card">

                        {/* Girl image — floats above and to the right of the card */}
                        <img src={womanImg} alt="Professional" className="woman-img" />

                        {/* Text — top-left of card */}
                        <div className="promo-card-text">
                            <p className="promo-text">
                                Very good works are<br />
                                waiting for you<br />
                                <strong>Login Now!!!</strong>
                            </p>
                        </div>

                    </div>

                    {/* Lightning badge — left of card, vertically centered */}
                    <div className="lightning-badge">
                        <svg width="22" height="22" viewBox="0 0 24 24"
                            fill="#f6c90e" stroke="#f6c90e" strokeWidth="1"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default Login;