import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './MindMapGenerator.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── Tree layout helpers ──────────────────────────────────────────────
const NODE_W = 140;
const NODE_H = 44;
const H_GAP = 60;
const V_GAP = 18;

function measureTree(node) {
  if (!node.children || node.children.length === 0) {
    node._height = NODE_H;
    return;
  }
  node.children.forEach(measureTree);
  const totalChildH = node.children.reduce((s, c) => s + c._height, 0)
    + V_GAP * (node.children.length - 1);
  node._height = Math.max(NODE_H, totalChildH);
}

function positionTree(node, x, y) {
  node._x = x;
  node._y = y + (node._height - NODE_H) / 2;
  if (!node.children || node.children.length === 0) return;
  let cy = y;
  node.children.forEach((child) => {
    positionTree(child, x + NODE_W + H_GAP, cy);
    cy += child._height + V_GAP;
  });
}

function collectNodes(node, arr = []) {
  arr.push(node);
  (node.children || []).forEach((c) => collectNodes(c, arr));
  return arr;
}

function collectEdges(node, arr = []) {
  (node.children || []).forEach((child) => {
    const x1 = node._x + NODE_W;
    const y1 = node._y + NODE_H / 2;
    const x2 = child._x;
    const y2 = child._y + NODE_H / 2;
    const mx = (x1 + x2) / 2;
    arr.push({ x1, y1, x2, y2, mx, color: child.color || '#6366f1' });
    collectEdges(child, arr);
  });
  return arr;
}

function buildLayout(tree) {
  measureTree(tree);
  positionTree(tree, 0, 0);
  const nodes = collectNodes(tree);
  const edges = collectEdges(tree);
  const minX = Math.min(...nodes.map((n) => n._x)) - 20;
  const minY = Math.min(...nodes.map((n) => n._y)) - 20;
  const maxX = Math.max(...nodes.map((n) => n._x + NODE_W)) + 20;
  const maxY = Math.max(...nodes.map((n) => n._y + NODE_H)) + 20;
  return { nodes, edges, width: maxX - minX, height: maxY - minY, offsetX: -minX, offsetY: -minY };
}

// ── Component ────────────────────────────────────────────────────────
const MindMapGenerator = () => {
  const { token } = useAuth();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapData, setMapData] = useState(null);
  const [layout, setLayout] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const examples = [
    'Object Oriented Programming',
    'French Revolution',
    'Machine Learning',
    'Human Digestive System',
    'Cloud Computing',
    'Data Structures',
  ];

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setMapData(null);
    setLayout(null);
    try {
  const res = await fetch(`${API}/api/mindmap/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ topic }),
  });

  const text = await res.text(); // read as text first
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', text.substring(0, 200));
    throw new Error(`Server returned HTML instead of JSON. Check your REACT_APP_API_URL in .env`);
  }

  if (!res.ok) throw new Error(data.message || 'Failed');
  setMapData(data);
} catch (e) {
  setError(e.message);
} finally {
  setLoading(false);
}
  };

  useEffect(() => {
    if (!mapData) return;
    // deep clone to avoid mutating state
    const tree = JSON.parse(JSON.stringify(mapData));
    const l = buildLayout(tree);
    setLayout(l);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [mapData]);

  // Pan handlers
  const onMouseDown = useCallback((e) => {
    if (e.target.closest('.mm-node')) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom((z) => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Export as SVG
  const exportSVG = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current.querySelector('svg.mm-svg');
    if (!svgEl) return;
    const clone = svgEl.cloneNode(true);
    // set white background
    clone.style.background = '#fff';
    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(mapData?.topic || 'mindmap').replace(/\s+/g, '_')}_MindMap.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKey = (e) => { if (e.key === 'Enter') generate(); };

  return (
    <div className="mm-wrapper">
      {/* Header */}
      <div className="mm-header">
        <div className="mm-title-row">
          <span className="mm-icon">🧠</span>
          <div>
            <h1 className="mm-title">Mind Map Generator</h1>
            <p className="mm-subtitle">Enter any topic → AI builds a visual mind map instantly</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="mm-input-card">
        <label className="mm-label">Enter Topic / Chapter</label>
        <div className="mm-input-row">
          <input
            className="mm-input"
            placeholder="e.g. Object Oriented Programming, French Revolution..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKey}
          />
          <button className="mm-btn-generate" onClick={generate} disabled={loading || !topic.trim()}>
            {loading ? <span className="mm-spinner" /> : '🧠 Generate'}
          </button>
        </div>

        {/* Examples */}
        <div className="mm-examples">
          <span className="mm-examples-label">Try: </span>
          {examples.map((ex) => (
            <button key={ex} className="mm-chip" onClick={() => setTopic(ex)}>
              {ex}
            </button>
          ))}
        </div>

        {error && <div className="mm-error">⚠️ {error}</div>}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mm-loading-card">
          <div className="mm-loading-anim">
            <div className="mm-pulse" />
            <div className="mm-pulse mm-pulse2" />
            <div className="mm-pulse mm-pulse3" />
          </div>
          <p className="mm-loading-text">🧠 Building your mind map...</p>
          <p className="mm-loading-sub">AI is organizing the concepts hierarchically</p>
        </div>
      )}

      {/* Mind Map Canvas */}
      {layout && mapData && (
        <div className="mm-canvas-card">
          {/* Toolbar */}
          <div className="mm-toolbar">
            <div className="mm-map-title">🧠 {mapData.topic}</div>
            <div className="mm-toolbar-actions">
              <button className="mm-tool-btn" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>＋ Zoom In</button>
              <button className="mm-tool-btn" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>－ Zoom Out</button>
              <button className="mm-tool-btn" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>⊡ Reset</button>
              <button className="mm-tool-btn mm-btn-export" onClick={exportSVG}>⬇ Export SVG</button>
            </div>
          </div>

          {/* Zoom hint */}
          <p className="mm-hint">🖱 Scroll to zoom • Drag to pan</p>

          {/* SVG Canvas */}
          <div
            ref={svgRef}
            className="mm-svg-container"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          >
            <svg
              className="mm-svg"
              width={layout.width}
              height={layout.height}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: '0 0',
                overflow: 'visible',
              }}
            >
              <defs>
                {layout.edges.map((e, i) => (
                  <linearGradient key={i} id={`eg${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={mapData.color || '#6366f1'} />
                    <stop offset="100%" stopColor={e.color} />
                  </linearGradient>
                ))}
              </defs>

              {/* Edges */}
              {layout.edges.map((e, i) => (
                <path
                  key={i}
                  d={`M${e.x1},${e.y1} C${e.mx},${e.y1} ${e.mx},${e.y2} ${e.x2},${e.y2}`}
                  fill="none"
                  stroke={`url(#eg${i})`}
                  strokeWidth="2"
                  opacity="0.7"
                />
              ))}

              {/* Nodes */}
              {layout.nodes.map((node, i) => {
                const x = node._x + layout.offsetX;
                const y = node._y + layout.offsetY;
                const isRoot = i === 0;
                const color = node.color || '#6366f1';
                const depth = node.id ? (node.id.split('-').length) : 0;
                const rx = isRoot ? 22 : 12;
                const fontSize = isRoot ? 13 : depth <= 1 ? 12 : 11;

                return (
                  <g key={node.id || 'root'} className="mm-node" transform={`translate(${x},${y})`}>
                    {isRoot ? (
                      <rect
                        width={NODE_W} height={NODE_H} rx={rx}
                        fill={color} opacity={0.95}
                      />
                    ) : (
                      <>
                        <rect
                          width={NODE_W} height={NODE_H} rx={rx}
                          fill={color} opacity={0.15}
                        />
                        <rect
                          width={NODE_W} height={NODE_H} rx={rx}
                          fill="none" stroke={color} strokeWidth="1.5"
                        />
                      </>
                    )}
                    <foreignObject width={NODE_W} height={NODE_H}>
                      <div
                        xmlns="http://www.w3.org/1999/xhtml"
                        style={{
                          width: NODE_W,
                          height: NODE_H,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px 8px',
                          boxSizing: 'border-box',
                          textAlign: 'center',
                          fontSize,
                          fontWeight: isRoot ? 700 : depth <= 1 ? 600 : 400,
                          color: isRoot ? '#fff' : color,
                          lineHeight: 1.2,
                          wordBreak: 'break-word',
                          fontFamily: 'Inter, sans-serif',
                          userSelect: 'none',
                        }}
                      >
                        {node.label || node.topic}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Branch list */}
          <div className="mm-branch-list">
            <h3 className="mm-branch-heading">📋 Map Branches</h3>
            <div className="mm-branches">
              {mapData.children.map((branch) => (
                <div key={branch.id} className="mm-branch-item" style={{ borderLeftColor: branch.color }}>
                  <div className="mm-branch-name" style={{ color: branch.color }}>{branch.label}</div>
                  <div className="mm-branch-subs">
                    {(branch.children || []).map((sub) => (
                      <span key={sub.id} className="mm-sub-tag">{sub.label}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapGenerator;