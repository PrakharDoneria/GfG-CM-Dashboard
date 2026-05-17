'use client';
import './points.css';

export default function PointsSchemePage() {
  return (
    <div className="points-scheme-container">
      {/* Hero Banner */}
      <div className="points-hero animate-fade-in">
        <div className="points-hero-left">
          <div className="points-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            Rewards System
          </div>
          <h1 className="points-hero-title">Points Allocation Scheme</h1>
          <p className="points-hero-subtitle">
            Earn points by solving coding problems and contributing to the GeeksforGeeks community.
          </p>
        </div>
        <div className="points-hero-right">
          <div className="gfg-badge-circle">
            <img src="https://media.geeksforgeeks.org/gfg-gg-logo.svg" alt="GfG" />
          </div>
        </div>
      </div>

      <div className="points-grids">
        {/* Practice Points Column */}
        <div className="points-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <div className="icon-wrapper practice-color">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6M12 2v20"/></svg>
            </div>
            <h2>GfG Practice Submissions</h2>
          </div>
          <p className="card-desc">
            Points are awarded automatically based on the difficulty rating of the problems you successfully solve on the GeeksforGeeks Practice platform.
          </p>

          <div className="scheme-list">
            <div className="scheme-item">
              <div className="difficulty basic">Basic</div>
              <div className="points-val">+2 pts <span className="per-unit">/ problem</span></div>
            </div>
            <div className="scheme-item">
              <div className="difficulty easy">Easy</div>
              <div className="points-val">+5 pts <span className="per-unit">/ problem</span></div>
            </div>
            <div className="scheme-item">
              <div className="difficulty medium">Medium</div>
              <div className="points-val">+15 pts <span className="per-unit">/ problem</span></div>
            </div>
            <div className="scheme-item">
              <div className="difficulty hard">Hard</div>
              <div className="points-val">+40 pts <span className="per-unit">/ problem</span></div>
            </div>
          </div>
        </div>

        {/* Community Points Column */}
        <div className="points-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <div className="icon-wrapper community-color">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </div>
            <h2>GfG Community Contributions</h2>
          </div>
          <p className="card-desc">
            Publish high-quality articles, writeups, and experiences on the GeeksforGeeks community portal. Points are scaled by post engagement.
          </p>

          <div className="scheme-list">
            <div className="scheme-item">
              <div className="contribution-type">Base Post Published</div>
              <div className="points-val">+15 pts <span className="per-unit">/ post</span></div>
            </div>
            <div className="scheme-item">
              <div className="contribution-type">Community Likes Received</div>
              <div className="points-val">+2 pts <span className="per-unit">/ like</span></div>
            </div>
            <div className="scheme-item">
              <div className="contribution-type">Community Comments Received</div>
              <div className="points-val">+5 pts <span className="per-unit">/ comment</span></div>
            </div>
          </div>

          <div className="formula-box">
            <span className="formula-title">Points Formula</span>
            <code className="formula-code">
              Score = (Posts × 15) + (Likes × 2) + (Comments × 5)
            </code>
          </div>
        </div>
      </div>

      {/* Rules Card */}
      <div className="points-card rules-card animate-fade-in" style={{ animationDelay: '0.3s', marginTop: '24px' }}>
        <div className="card-header">
          <div className="icon-wrapper rules-color">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h2>Program Rules & Terms</h2>
        </div>
        <div className="rules-content">
          <ul>
            <li>
              <strong>Active Timeframe:</strong> Only submissions resolved and posts published strictly on and after <strong>May 17, 2026</strong> are eligible for point syncs.
            </li>
            <li>
              <strong>Handle Integrity:</strong> Once a GeeksforGeeks handle is linked to your dashboard profile, it is locked and cannot be changed or transferred.
            </li>
            <li>
              <strong>Synchronization:</strong> Points can be updated instantly from your dashboard profile sync actions, or verified by administrators at any time.
            </li>
            <li>
              <strong>Fair Play:</strong> Plagiarism or duplicate posting will result in immediate disqualification and deduction of points.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
