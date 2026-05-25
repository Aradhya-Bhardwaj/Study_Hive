import React, { useState, useEffect } from 'react';

export default function CpuScheduler() {
  const [processes, setProcesses] = useState([
    { id: 'P1', arrival: 0, burst: 8, priority: 2 },
    { id: 'P2', arrival: 1, burst: 4, priority: 1 },
    { id: 'P3', arrival: 2, burst: 9, priority: 3 },
    { id: 'P4', arrival: 3, burst: 5, priority: 4 }
  ]);

  const [algo, setAlgo] = useState('FCFS');
  const [quantum, setQuantum] = useState(2);
  const [results, setResults] = useState({ gantt: [], processStats: [], avgWt: 0, avgTat: 0 });

  const addProcess = () => {
    const nextId = `P${processes.length + 1}`;
    setProcesses([...processes, { id: nextId, arrival: 0, burst: 5, priority: 1 }]);
  };

  const removeProcess = (index) => {
    if (processes.length > 1) {
      setProcesses(processes.filter((_, i) => i !== index));
    }
  };

  const updateProcess = (index, key, val) => {
    const newProcesses = [...processes];
    newProcesses[index] = { ...newProcesses[index], [key]: parseInt(val) || 0 };
    setProcesses(newProcesses);
  };

  useEffect(() => {
    calculateScheduling();
  }, [processes, algo, quantum]);

  const calculateScheduling = () => {
    // Clone processes
    let procs = processes.map(p => ({
      id: p.id,
      arrival: p.arrival,
      burst: p.burst,
      priority: p.priority,
      remaining: p.burst,
      completion: 0,
      turnaround: 0,
      waiting: 0
    }));

    let gantt = [];
    let currentTime = 0;
    let completed = 0;
    const n = procs.length;

    // Helper to find arrived processes
    const getArrived = (time) => procs.filter(p => p.arrival <= time && p.remaining > 0);

    if (algo === 'FCFS') {
      let sorted = [...procs].sort((a, b) => a.arrival - b.arrival);
      sorted.forEach(p => {
        if (currentTime < p.arrival) {
          gantt.push({ id: 'Idle', start: currentTime, end: p.arrival });
          currentTime = p.arrival;
        }
        gantt.push({ id: p.id, start: currentTime, end: currentTime + p.burst });
        currentTime += p.burst;
        
        // Find index in main list and update completion
        const mainIdx = procs.findIndex(mp => mp.id === p.id);
        procs[mainIdx].completion = currentTime;
      });
    } else if (algo === 'SJF') {
      // Non-preemptive Shortest Job First
      while (completed < n) {
        let arrived = getArrived(currentTime);
        if (arrived.length === 0) {
          let nextArrival = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
          gantt.push({ id: 'Idle', start: currentTime, end: nextArrival });
          currentTime = nextArrival;
          continue;
        }
        // Pick process with shortest burst
        arrived.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
        let p = arrived[0];
        
        gantt.push({ id: p.id, start: currentTime, end: currentTime + p.burst });
        currentTime += p.burst;
        p.remaining = 0;
        p.completion = currentTime;
        completed++;
      }
    } else if (algo === 'SRTF') {
      // Preemptive Shortest Remaining Time First
      let lastPid = null;
      let startInterval = 0;

      while (completed < n) {
        let arrived = getArrived(currentTime);
        if (arrived.length === 0) {
          if (lastPid !== 'Idle') {
            if (lastPid !== null) gantt.push({ id: lastPid, start: startInterval, end: currentTime });
            lastPid = 'Idle';
            startInterval = currentTime;
          }
          let nextArrival = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
          currentTime = nextArrival;
          continue;
        }

        arrived.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);
        let p = arrived[0];

        if (p.id !== lastPid) {
          if (lastPid !== null) {
            gantt.push({ id: lastPid, start: startInterval, end: currentTime });
          }
          lastPid = p.id;
          startInterval = currentTime;
        }

        p.remaining -= 1;
        currentTime += 1;

        if (p.remaining === 0) {
          p.completion = currentTime;
          completed++;
          lastPid = null; // Forces pushing to gantt next iteration
        }
      }
      if (lastPid !== null) {
        gantt.push({ id: lastPid, start: startInterval, end: currentTime });
      }
    } else if (algo === 'Priority') {
      // Non-preemptive Priority Scheduling (lower value = higher priority)
      while (completed < n) {
        let arrived = getArrived(currentTime);
        if (arrived.length === 0) {
          let nextArrival = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
          gantt.push({ id: 'Idle', start: currentTime, end: nextArrival });
          currentTime = nextArrival;
          continue;
        }
        arrived.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
        let p = arrived[0];
        gantt.push({ id: p.id, start: currentTime, end: currentTime + p.burst });
        currentTime += p.burst;
        p.remaining = 0;
        p.completion = currentTime;
        completed++;
      }
    } else if (algo === 'RR') {
      // Round Robin
      let queue = [];
      let time = 0;
      let sortedProcs = [...procs].sort((a, b) => a.arrival - b.arrival);
      
      // Load initial processes
      sortedProcs.forEach(p => {
        if (p.arrival <= time) queue.push(p);
      });

      if (queue.length === 0 && sortedProcs.length > 0) {
        time = sortedProcs[0].arrival;
        sortedProcs.forEach(p => {
          if (p.arrival <= time) queue.push(p);
        });
      }

      while (completed < n) {
        if (queue.length === 0) {
          let nextArrival = Math.min(...procs.filter(p => p.remaining > 0).map(p => p.arrival));
          gantt.push({ id: 'Idle', start: time, end: nextArrival });
          time = nextArrival;
          // Load newly arrived
          procs.forEach(p => {
            if (p.arrival <= time && p.remaining > 0 && !queue.includes(p)) queue.push(p);
          });
          continue;
        }

        let p = queue.shift();
        let runTime = Math.min(quantum, p.remaining);

        gantt.push({ id: p.id, start: time, end: time + runTime });
        time += runTime;
        p.remaining -= runTime;

        // Load processes that arrived while p was running
        procs.forEach(np => {
          if (np.arrival <= time && np.remaining > 0 && np.id !== p.id && !queue.includes(np)) {
            queue.push(np);
          }
        });

        if (p.remaining > 0) {
          queue.push(p); // Add back to queue
        } else {
          p.completion = time;
          completed++;
        }
      }
    }

    // Compute stats
    let totalWt = 0;
    let totalTat = 0;
    
    procs.forEach(p => {
      p.turnaround = p.completion - p.arrival;
      p.waiting = p.turnaround - p.burst;
      totalWt += p.waiting;
      totalTat += p.turnaround;
    });

    setResults({
      gantt,
      processStats: procs,
      avgWt: (totalWt / n).toFixed(2),
      avgTat: (totalTat / n).toFixed(2)
    });
  };

  // Color palette for processes
  const getProcessColor = (id) => {
    if (id === 'Idle') return '#475569';
    const index = parseInt(id.replace('P', '')) || 0;
    const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
    return colors[index % colors.length];
  };

  return (
    <div className="simulator-panel">
      <h3 className="simulator-title">🎛️ CPU Scheduling Simulator</h3>
      <div className="simulator-layout">
        
        {/* Controls */}
        <div className="simulator-controls">
          <div className="simulator-control-group">
            <span className="simulator-label">Algorithm</span>
            <select value={algo} onChange={(e) => setAlgo(e.target.value)} className="simulator-input">
              <option value="FCFS">First-Come, First-Served (FCFS)</option>
              <option value="SJF">Shortest Job First (SJF)</option>
              <option value="SRTF">Shortest Remaining Time First (SRTF)</option>
              <option value="Priority">Priority Scheduling</option>
              <option value="RR">Round Robin (RR)</option>
            </select>
          </div>

          {algo === 'RR' && (
            <div className="simulator-control-group">
              <span className="simulator-label">Time Quantum ({quantum})</span>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={quantum} 
                onChange={(e) => setQuantum(parseInt(e.target.value))} 
                className="simulator-slider"
              />
            </div>
          )}

          <button onClick={addProcess} className="btn btn-primary" style={{ height: '42px' }}>
            + Add Process
          </button>
        </div>

        {/* Process Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {processes.map((p, idx) => (
            <div key={p.id} className="glass" style={{ padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: getProcessColor(p.id) }}>{p.id}</span>
                {processes.length > 1 && (
                  <button onClick={() => removeProcess(idx)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Remove
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="simulator-label" style={{ fontSize: '0.75rem' }}>Arrival</label>
                  <input type="number" min="0" value={p.arrival} onChange={(e) => updateProcess(idx, 'arrival', e.target.value)} className="simulator-input" style={{ padding: '6px' }} />
                </div>
                <div>
                  <label className="simulator-label" style={{ fontSize: '0.75rem' }}>Burst</label>
                  <input type="number" min="1" value={p.burst} onChange={(e) => updateProcess(idx, 'burst', e.target.value)} className="simulator-input" style={{ padding: '6px' }} />
                </div>
                <div>
                  <label className="simulator-label" style={{ fontSize: '0.75rem' }}>Priority</label>
                  <input type="number" min="1" value={p.priority} onChange={(e) => updateProcess(idx, 'priority', e.target.value)} className="simulator-input" style={{ padding: '6px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Gantt Chart SVG */}
        <div className="simulator-visualization">
          <span className="simulator-label" style={{ marginBottom: '12px', display: 'block' }}>Gantt Chart Visualizer</span>
          {results.gantt.length > 0 && (
            <div className="simulator-svg-wrap">
              <svg viewBox={`0 0 700 80`} width="100%" height="80px" style={{ minWidth: '500px' }}>
                {(() => {
                  const totalTime = results.gantt[results.gantt.length - 1].end;
                  const scale = totalTime > 0 ? 660 / totalTime : 0;
                  return (
                    <g transform="translate(10, 10)">
                      {results.gantt.map((g, i) => {
                        const width = (g.end - g.start) * scale;
                        const x = g.start * scale;
                        return (
                          <g key={i} className="gantt-bar">
                            <rect 
                              x={x} 
                              y={0} 
                              width={width} 
                              height={35} 
                              fill={getProcessColor(g.id)} 
                              stroke="rgba(0,0,0,0.2)"
                              strokeWidth="1"
                              rx="4"
                            />
                            <text 
                              x={x + width / 2} 
                              y={22} 
                              fill="#fff" 
                              fontSize="11" 
                              fontWeight="600"
                              textAnchor="middle"
                            >
                              {g.id}
                            </text>
                            {/* Tick values */}
                            <text x={x} y={52} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">{g.start}</text>
                            {i === results.gantt.length - 1 && (
                              <text x={x + width} y={52} fill="var(--text-secondary)" fontSize="10" textAnchor="middle">{g.end}</text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div>
          <span className="simulator-label">Performance Metrics</span>
          <div style={{ overflowX: 'auto' }}>
            <table className="simulator-table">
              <thead>
                <tr>
                  <th>Process</th>
                  <th>Arrival Time</th>
                  <th>Burst Time</th>
                  <th>Priority</th>
                  <th>Completion Time</th>
                  <th>Turnaround Time</th>
                  <th>Waiting Time</th>
                </tr>
              </thead>
              <tbody>
                {results.processStats.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '600', color: getProcessColor(p.id) }}>{p.id}</td>
                    <td>{p.arrival}</td>
                    <td>{p.burst}</td>
                    <td>{p.priority}</td>
                    <td>{p.completion}</td>
                    <td>{p.turnaround}</td>
                    <td>{p.waiting}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
            <div>
              <span className="simulator-label" style={{ fontSize: '0.8rem' }}>Average Waiting Time</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-secondary)' }}>{results.avgWt} ms</div>
            </div>
            <div>
              <span className="simulator-label" style={{ fontSize: '0.8rem' }}>Average Turnaround Time</span>
              <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{results.avgTat} ms</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
