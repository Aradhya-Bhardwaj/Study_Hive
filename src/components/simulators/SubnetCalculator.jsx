import React, { useState, useEffect } from 'react';

export default function SubnetCalculator() {
  const [ip, setIp] = useState('192.168.1.100');
  const [cidr, setCidr] = useState(24);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    calculateSubnet();
  }, [ip, cidr]);

  const ipToNum = (ipStr) => {
    const parts = ipStr.split('.');
    if (parts.length !== 4) return null;
    let num = 0;
    for (let i = 0; i < 4; i++) {
      const part = parseInt(parts[i]);
      if (isNaN(part) || part < 0 || part > 255) return null;
      num = (num * 256) + part;
    }
    return num >>> 0;
  };

  const numToIp = (num) => {
    num = num >>> 0;
    const octets = [];
    octets[0] = Math.floor(num / 16777216) % 256;
    octets[1] = Math.floor(num / 65536) % 256;
    octets[2] = Math.floor(num / 256) % 256;
    octets[3] = num % 256;
    return octets.join('.');
  };

  const toBinaryString = (num) => {
    num = num >>> 0;
    let bin = num.toString(2).padStart(32, '0');
    return [
      bin.slice(0, 8),
      bin.slice(8, 16),
      bin.slice(16, 24),
      bin.slice(24, 32)
    ];
  };

  const calculateSubnet = () => {
    setError('');
    const ipNum = ipToNum(ip.trim());
    
    if (ipNum === null) {
      setError('Invalid IPv4 address format. Please enter four octets (0-255) separated by dots.');
      setResults(null);
      return;
    }

    // Mask calculation
    let maskNum = 0;
    if (cidr > 0) {
      maskNum = (~0 << (32 - cidr)) >>> 0;
    }
    
    const maskStr = numToIp(maskNum);
    const netNum = (ipNum & maskNum) >>> 0;
    const netStr = numToIp(netNum);

    const wildcardNum = (~maskNum) >>> 0;
    const wildcardStr = numToIp(wildcardNum);

    const broadcastNum = (netNum | wildcardNum) >>> 0;
    const broadcastStr = numToIp(broadcastNum);

    const totalHosts = Math.pow(2, 32 - cidr);
    let usableHosts = (cidr >= 31) ? totalHosts : (totalHosts - 2);
    if (cidr === 32) usableHosts = 1;

    let firstUsableStr, lastUsableStr;
    if (cidr === 32) {
      firstUsableStr = netStr;
      lastUsableStr = netStr;
    } else if (cidr === 31) {
      firstUsableStr = netStr;
      lastUsableStr = broadcastStr;
    } else {
      firstUsableStr = numToIp(netNum + 1);
      lastUsableStr = numToIp(broadcastNum - 1);
    }

    const ipBin = toBinaryString(ipNum);
    const maskBin = toBinaryString(maskNum);
    const netBin = toBinaryString(netNum);

    setResults({
      maskStr,
      netStr,
      broadcastStr,
      firstUsableStr,
      lastUsableStr,
      usableHosts,
      wildcardStr,
      ipBin,
      maskBin,
      netBin
    });
  };

  return (
    <div className="simulator-panel">
      <h3 className="simulator-title">🎛️ Subnet CIDR Calculator</h3>
      <div className="simulator-layout">
        
        {/* Input Controls */}
        <div className="simulator-controls" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="simulator-control-group">
            <span className="simulator-label">IP Address</span>
            <input 
              type="text" 
              value={ip} 
              onChange={(e) => setIp(e.target.value)} 
              className="simulator-input"
              placeholder="e.g. 192.168.1.1"
            />
          </div>

          <div className="simulator-control-group">
            <span className="simulator-label">CIDR Prefix (/{cidr})</span>
            <input 
              type="range" 
              min="1" 
              max="32" 
              value={cidr} 
              onChange={(e) => setCidr(parseInt(e.target.value))} 
              className="simulator-slider"
            />
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--accent-error)', fontSize: '0.9rem', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
            ⚠️ {error}
          </div>
        )}

        {results && (
          <>
            {/* Binary Bit Grid Visualizer */}
            <div className="simulator-visualization" style={{ padding: '16px 20px' }}>
              <span className="simulator-label" style={{ marginBottom: '12px', display: 'block' }}>Binary Mask Octet Blueprint (Network vs Host bits)</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="simulator-label" style={{ minWidth: '80px', fontSize: '0.78rem' }}>IP Address:</span>
                  <div className="subnet-bits-grid">
                    {results.ipBin.map((octet, oIdx) => (
                      <React.Fragment key={oIdx}>
                        {octet.split('').map((bit, bIdx) => {
                          const globalIdx = oIdx * 8 + bIdx;
                          const isNet = globalIdx < cidr;
                          return (
                            <span key={bIdx} className={`subnet-bit-box ${isNet ? 'net-bit' : 'host-bit'}`}>
                              {bit}
                            </span>
                          );
                        })}
                        {oIdx < 3 && <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>.</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="simulator-label" style={{ minWidth: '80px', fontSize: '0.78rem' }}>Subnet Mask:</span>
                  <div className="subnet-bits-grid">
                    {results.maskBin.map((octet, oIdx) => (
                      <React.Fragment key={oIdx}>
                        {octet.split('').map((bit, bIdx) => {
                          const globalIdx = oIdx * 8 + bIdx;
                          const isNet = globalIdx < cidr;
                          return (
                            <span key={bIdx} className={`subnet-bit-box ${isNet ? 'net-bit' : 'host-bit'}`}>
                              {bit}
                            </span>
                          );
                        })}
                        {oIdx < 3 && <span style={{ color: 'var(--text-muted)', alignSelf: 'center' }}>.</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--accent-primary-glow)', border: '1px solid var(--accent-primary)', borderRadius: '2px' }}></span>
                  <span>Network Bits ({cidr})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '2px' }}></span>
                  <span>Host Bits ({32 - cidr})</span>
                </div>
              </div>
            </div>

            {/* Calculations Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="glass" style={{ padding: '16px' }}>
                <span className="simulator-label" style={{ fontSize: '0.78rem' }}>Subnet Mask</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '4px' }}>{results.maskStr}</div>
              </div>

              <div className="glass" style={{ padding: '16px' }}>
                <span className="simulator-label" style={{ fontSize: '0.78rem' }}>Network ID</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '4px', color: 'var(--accent-primary)' }}>{results.netStr}</div>
              </div>

              <div className="glass" style={{ padding: '16px' }}>
                <span className="simulator-label" style={{ fontSize: '0.78rem' }}>Broadcast ID</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '4px', color: 'var(--accent-secondary)' }}>{results.broadcastStr}</div>
              </div>

              <div className="glass" style={{ padding: '16px' }}>
                <span className="simulator-label" style={{ fontSize: '0.78rem' }}>Usable Hosts</span>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '4px', color: 'var(--accent-success)' }}>{results.usableHosts.toLocaleString()}</div>
              </div>
            </div>

            <div className="glass" style={{ padding: '18px 24px', borderRadius: '8px' }}>
              <span className="simulator-label" style={{ fontSize: '0.8rem' }}>Usable IP Address Range</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                  {results.firstUsableStr} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 8px' }}>to</span> {results.lastUsableStr}
                </div>
                <span style={{ fontSize: '0.82rem', padding: '4px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                  Wildcard Mask: {results.wildcardStr}
                </span>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
