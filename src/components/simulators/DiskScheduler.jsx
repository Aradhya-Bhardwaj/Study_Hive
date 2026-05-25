import React, { useState, useEffect } from 'react';

export default function DiskScheduler() {
  const [queueInput, setQueueInput] = useState('98, 183, 37, 122, 14, 124, 65, 67');
  const [startHead, setStartHead] = useState(53);
  const [maxCylinder, setMaxCylinder] = useState(200);
  const [direction, setDirection] = useState('High'); // 'High' or 'Low'
  const [algo, setAlgo] = useState('FCFS');
  
  const [results, setResults] = useState({ path: [], totalSeek: 0 });

  useEffect(() => {
    calculateDiskScheduling();
  }, [queueInput, startHead, maxCylinder, direction, algo]);

  const calculateDiskScheduling = () => {
    // Parse queue inputs
    const queue = queueInput
      .split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n) && n >= 0 && n < maxCylinder);

    if (queue.length === 0) {
      setResults({ path: [startHead], totalSeek: 0 });
      return;
    }

    let head = startHead;
    let path = [head];
    let totalSeek = 0;

    const copyQueue = [...queue];

    if (algo === 'FCFS') {
      path = [head, ...copyQueue];
    } else if (algo === 'SSTF') {
      let current = head;
      let q = [...copyQueue];
      while (q.length > 0) {
        // Find closest
        q.sort((a, b) => Math.abs(a - current) - Math.abs(b - current));
        let next = q.shift();
        path.push(next);
        current = next;
      }
    } else if (algo === 'SCAN') {
      let q = [...copyQueue].sort((a, b) => a - b);
      let left = q.filter(x => x < head);
      let right = q.filter(x => x >= head);

      if (direction === 'High') {
        // Go to max, then reverse
        path = [head, ...right, maxCylinder - 1];
        // Reverse left
        left.reverse();
        path = [...path, ...left];
      } else {
        // Go to 0, then reverse
        left.reverse();
        path = [head, ...left, 0];
        path = [...path, ...right];
      }
    } else if (algo === 'C-SCAN') {
      let q = [...copyQueue].sort((a, b) => a - b);
      let left = q.filter(x => x < head);
      let right = q.filter(x => x >= head);

      if (direction === 'High') {
        // Go to max, jump to 0, go to head
        path = [head, ...right, maxCylinder - 1, 0, ...left];
      } else {
        // Go to 0, jump to max, go down to head
        left.reverse();
        right.reverse();
        path = [head, ...left, 0, maxCylinder - 1, ...right];
      }
    } else if (algo === 'LOOK') {
      let q = [...copyQueue].sort((a, b) => a - b);
      let left = q.filter(x => x < head);
      let right = q.filter(x => x >= head);

      if (direction === 'High') {
        path = [head, ...right];
        left.reverse();
        path = [...path, ...left];
      } else {
        left.reverse();
        path = [head, ...left, ...right];
      }
    } else if (algo === 'C-LOOK') {
      let q = [...copyQueue].sort((a, b) => a - b);
      let left = q.filter(x => x < head);
      let right = q.filter(x => x >= head);

      if (direction === 'High') {
        path = [head, ...right, ...left];
      } else {
        left.reverse();
        right.reverse();
        path = [head, ...left, ...right];
      }
    }

    // Calculate seek time
    for (let i = 1; i < path.length; i++) {
      // If it's a jump in C-SCAN or C-LOOK, don't count jump cost or count it depending on standard?
      // Standard academic textbook: jumps in C-SCAN (from maxCylinder-1 to 0) do not add to seek count or add 0.
      // Let's count actual seek distance, but if it is a circular jump (e.g. from max to 0 or 0 to max), we exclude it 
      // from actual head movement calculation if standard, or count it. Let's count it except when jumping.
      const isJump = (algo === 'C-SCAN' && ((path[i-1] === maxCylinder - 1 && path[i] === 0) || (path[i-1] === 0 && path[i] === maxCylinder - 1))) ||
                     (algo === 'C-LOOK' && right.length > 0 && left.length > 0 && 
                      ((direction === 'High' && path[i-1] === right[right.length - 1] && path[i] === left[0]) ||
                       (direction === 'Low' && path[i-1] === left[left.length - 1] && path[i] === right[right.length - 1])));
      
      if (!isJump) {
        totalSeek += Math.abs(path[i] - path[i - 1]);
      }
    }

    setResults({ path, totalSeek });
  };

  return (
    <div className="simulator-panel">
      <h3 className="simulator-title">🎛️ Disk Scheduling Head Plotter</h3>
      <div className="simulator-layout">
        
        {/* Controls */}
        <div className="simulator-controls">
          <div className="simulator-control-group">
            <span className="simulator-label">Algorithm</span>
            <select value={algo} onChange={(e) => setAlgo(e.target.value)} className="simulator-input">
              <option value="FCFS">First-Come, First-Served (FCFS)</option>
              <option value="SSTF">Shortest Seek Time First (SSTF)</option>
              <option value="SCAN">SCAN (Elevator)</option>
              <option value="C-SCAN">C-SCAN (Circular SCAN)</option>
              <option value="LOOK">LOOK</option>
              <option value="C-LOOK">C-LOOK</option>
            </select>
          </div>

          <div className="simulator-control-group">
            <span className="simulator-label">Request Queue (0-{maxCylinder - 1})</span>
            <input 
              type="text" 
              value={queueInput} 
              onChange={(e) => setQueueInput(e.target.value)} 
              className="simulator-input"
            />
          </div>

          <div className="simulator-control-group" style={{ maxWidth: '120px' }}>
            <span className="simulator-label">Start Head</span>
            <input 
              type="number" 
              value={startHead} 
              onChange={(e) => setStartHead(Math.max(0, Math.min(maxCylinder - 1, parseInt(e.target.value) || 0)))} 
              className="simulator-input"
            />
          </div>

          <div className="simulator-control-group">
            <span className="simulator-label">Direction (for SCAN/LOOK)</span>
            <select value={direction} onChange={(e) => setDirection(e.target.value)} className="simulator-input">
              <option value="High">Towards High (Cylinders ↑)</option>
              <option value="Low">Towards Low (Cylinders ↓)</option>
            </select>
          </div>
        </div>

        {/* Chart plot visualization */}
        <div className="simulator-visualization" style={{ padding: '24px' }}>
          <span className="simulator-label" style={{ marginBottom: '16px', display: 'block' }}>Head Seek Path Trajectory</span>
          <div className="simulator-svg-wrap">
            <svg viewBox={`0 0 600 ${results.path.length * 40 + 40}`} width="100%" style={{ minWidth: '450px', background: 'rgba(0,0,0,0.15)', borderRadius: '6px' }}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const cyl = Math.round(p * (maxCylinder - 1));
                const x = 50 + p * 500;
                return (
                  <g key={idx}>
                    <line x1={x} y1={20} x2={x} y2={results.path.length * 40 + 20} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    <text x={x} y={15} fill="var(--text-muted)" fontSize="10" textAnchor="middle">{cyl}</text>
                  </g>
                );
              })}

              {/* Seek path lines */}
              {results.path.map((val, idx) => {
                const x = 50 + (val / (maxCylinder - 1)) * 500;
                const y = 40 + idx * 40;

                // Draw line to next point
                let line = null;
                if (idx < results.path.length - 1) {
                  const nextVal = results.path[idx + 1];
                  const nextX = 50 + (nextVal / (maxCylinder - 1)) * 500;
                  const nextY = 40 + (idx + 1) * 40;
                  
                  // Check if jump line
                  const isJump = (algo === 'C-SCAN' && ((val === maxCylinder - 1 && nextVal === 0) || (val === 0 && nextVal === maxCylinder - 1))) ||
                                 (algo === 'C-LOOK' && 
                                  ((direction === 'High' && val > nextVal && idx === results.path.indexOf(Math.max(...queue.filter(x => x >= startHead)))) ||
                                   (direction === 'Low' && val < nextVal && idx === results.path.indexOf(Math.min(...queue.filter(x => x < startHead))))));

                  line = (
                    <line 
                      x1={x} 
                      y1={y} 
                      x2={nextX} 
                      y2={nextY} 
                      stroke={isJump ? "rgba(239, 68, 68, 0.4)" : "var(--accent-secondary)"} 
                      strokeWidth="2" 
                      strokeDasharray={isJump ? "5,5" : "0"}
                    />
                  );
                }

                return (
                  <g key={idx}>
                    {line}
                    <circle cx={x} cy={y} r="5" fill={idx === 0 ? "var(--accent-primary)" : "var(--text-primary)"} />
                    <text x={x + 10} y={y + 4} fill="var(--text-secondary)" fontSize="10">{val}</text>
                    <text x={20} y={y + 4} fill="var(--text-muted)" fontSize="9" textAnchor="middle">#{idx}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Metrics Summary */}
        <div style={{ display: 'flex', gap: '24px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', alignItems: 'center' }}>
          <div>
            <span className="simulator-label" style={{ fontSize: '0.8rem' }}>Total Seek Operations</span>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-secondary)' }}>{results.totalSeek} Cylinders</div>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <strong>Seek Sequence:</strong> {results.path.join(' ➔ ')}
          </div>
        </div>

      </div>
    </div>
  );
}
