import React, { useState, useEffect } from 'react';

export default function AmdahlCalculator() {
  const [parallelFraction, setParallelFraction] = useState(0.8); // 80% default
  const [cores, setCores] = useState(8);

  const calculateSpeedup = (p, s) => {
    if (s === 1) return 1.0;
    return 1 / ((1 - p) + (p / s));
  };

  const currentSpeedup = calculateSpeedup(parallelFraction, cores);
  const maxPossibleSpeedup = parallelFraction < 1 ? 1 / (1 - parallelFraction) : Infinity;
  const reductionPercent = ((1 - 1 / currentSpeedup) * 100).toFixed(1);

  // Generate curve coordinate points for SVG
  const generateCurvePoints = () => {
    let points = [];
    const maxCoresVal = 64;
    const width = 500;
    const height = 150;

    for (let c = 1; c <= maxCoresVal; c++) {
      const s = calculateSpeedup(parallelFraction, c);
      // Map cores to x (1 to 64 -> 0 to width)
      const x = ((c - 1) / (maxCoresVal - 1)) * width;
      // Map speedup to y (0 to maxPossibleSpeedup -> height to 0)
      // Standardize y-axis ceiling to max of (p=0.99 at 64 cores speedup ≈ 33) or maximum speedup capped at 16 for better visibility
      const yCeil = parallelFraction > 0.95 ? 20 : Math.max(5, maxPossibleSpeedup);
      const y = height - (s / yCeil) * height;
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  return (
    <div className="simulator-panel">
      <h3 className="simulator-title">🎛️ Amdahl's Law Speedup Visualizer</h3>
      <div className="simulator-layout">
        
        {/* Input Sliders */}
        <div className="simulator-controls" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="simulator-control-group">
            <span className="simulator-label">Parallel Portion: {Math.round(parallelFraction * 100)}%</span>
            <input 
              type="range" 
              min="0" 
              max="0.99" 
              step="0.01"
              value={parallelFraction} 
              onChange={(e) => setParallelFraction(parseFloat(e.target.value))} 
              className="simulator-slider"
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Portion of execution code that can run concurrently in parallel.
            </span>
          </div>

          <div className="simulator-control-group">
            <span className="simulator-label">Processor Cores: {cores}</span>
            <input 
              type="range" 
              min="1" 
              max="64" 
              value={cores} 
              onChange={(e) => setCores(parseInt(e.target.value))} 
              className="simulator-slider"
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Number of physical threads or hardware CPU cores allocated.
            </span>
          </div>
        </div>

        {/* Speedup Curve Plot */}
        <div className="simulator-visualization" style={{ padding: '20px' }}>
          <span className="simulator-label" style={{ marginBottom: '12px', display: 'block' }}>Speedup Curve (Speedup Factor vs CPU Cores)</span>
          <div className="simulator-svg-wrap">
            <svg viewBox="0 0 540 180" width="100%" style={{ minWidth: '400px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
              <g transform="translate(30, 15)">
                {/* Axes */}
                <line x1={0} y1={150} x2={500} y2={150} stroke="var(--text-muted)" strokeWidth="1.5" />
                <line x1={0} y1={0} x2={0} y2={150} stroke="var(--text-muted)" strokeWidth="1.5" />
                
                {/* Y Axis Grid Tick Labels */}
                {[0, 0.5, 1.0].map((ratio, i) => {
                  const yCeil = parallelFraction > 0.95 ? 20 : Math.max(5, maxPossibleSpeedup);
                  const val = (ratio * yCeil).toFixed(1);
                  const y = 150 - ratio * 150;
                  return (
                    <g key={i}>
                      <line x1={-3} y1={y} x2={500} y2={y} stroke="rgba(255,255,255,0.03)" />
                      <text x={-8} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">{val}x</text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {[1, 16, 32, 48, 64].map((c) => {
                  const x = ((c - 1) / 63) * 500;
                  return (
                    <g key={c}>
                      <line x1={x} y1={150} x2={x} y2={153} stroke="var(--text-muted)" />
                      <text x={x} y={164} fill="var(--text-muted)" fontSize="9" textAnchor="middle">{c}</text>
                    </g>
                  );
                })}

                {/* Speedup curve line */}
                <polyline 
                  fill="none" 
                  stroke="var(--accent-primary)" 
                  strokeWidth="2.5" 
                  points={generateCurvePoints()} 
                />

                {/* Active marker coordinate dot */}
                {(() => {
                  const x = ((cores - 1) / 63) * 500;
                  const yCeil = parallelFraction > 0.95 ? 20 : Math.max(5, maxPossibleSpeedup);
                  const y = 150 - (currentSpeedup / yCeil) * 150;
                  return (
                    <g>
                      <line x1={x} y1={y} x2={x} y2={150} stroke="var(--accent-secondary)" strokeDasharray="3,3" />
                      <line x1={0} y1={y} x2={x} y2={y} stroke="var(--accent-secondary)" strokeDasharray="3,3" />
                      <circle cx={x} cy={y} r="6" fill="var(--accent-secondary)" />
                      <text x={x + 10} y={y - 8} fill="#fff" fontSize="10" fontWeight="600" textAnchor="start">
                        {currentSpeedup.toFixed(2)}x Speedup
                      </text>
                    </g>
                  );
                })()}

                {/* Labels */}
                <text x={250} y={178} fill="var(--text-muted)" fontSize="9" textAnchor="middle">Number of Cores</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Results Metrics Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="glass" style={{ padding: '16px' }}>
            <span className="simulator-label" style={{ fontSize: '0.78rem' }}>Current Speedup</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '4px', color: 'var(--accent-secondary)' }}>
              {currentSpeedup.toFixed(2)}x
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Tasks compile {currentSpeedup.toFixed(1)} times faster.
            </span>
          </div>

          <div className="glass" style={{ padding: '16px' }}>
            <span className="simulator-label" style={{ fontSize: '0.78rem' }}>Execution Time Reduced</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '4px', color: 'var(--accent-success)' }}>
              {reductionPercent}%
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Saves {reductionPercent}% processing duration.
            </span>
          </div>

          <div className="glass" style={{ padding: '16px' }}>
            <span className="simulator-label" style={{ fontSize: '0.78rem' }}>Theoretical Ceiling (Max Core limit)</span>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', marginTop: '4px', color: 'var(--accent-warning)' }}>
              {isFinite(maxPossibleSpeedup) ? `${maxPossibleSpeedup.toFixed(2)}x` : '∞'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Maximum speedup if cores were infinite.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
