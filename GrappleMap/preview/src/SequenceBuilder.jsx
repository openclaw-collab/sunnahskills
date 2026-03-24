/**
 * SequenceBuilder - UI for building GrappleMap sequences
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import UchimataCard from './UchimataCardHuman';

const PREDEFINED_SEQUENCES = {
  uchimata: {
    name: 'Uchi-mata → Arm Bar → Tap',
    category: 'Throw',
    items: [
      { type: 'position', id: 557, name: 'collar tie + tricep vs weak underhook' },
      { type: 'transition', id: 1383, name: 'uchi-mata (throw)' },
      { type: 'position', id: 558, name: 'throw finish' },
      { type: 'transition', id: 1387, name: 'arm bar transition' },
      { type: 'position', id: 57, name: 'arm bar w/ single leg over' },
      { type: 'transition', id: 1207, name: 'tap' },
      { type: 'position', id: 401, name: 'staredown' }
    ]
  },
  flyingScissor: {
    name: 'Get Up → Flying Scissor',
    category: 'Takedown',
    items: [
      { type: 'transition', id: 878, name: 'get up (standing w/ collar tie)' },
      { type: 'transition', id: 1385, name: 'get up (lead leg collar tie)' },
      { type: 'transition', id: 903, name: 'flying scissor (kani basami)' },
      { type: 'transition', id: 1089, name: 'flying scissor finish' },
      { type: 'position', id: 662, name: 'scissor finish position' }
    ]
  },
  bodyLockTriangle: {
    name: 'Body Lock Throw → Triangle',
    category: 'Chain',
    items: [
      { type: 'transition', id: 838, name: 'symmetric staggered standing' },
      { type: 'transition', id: 451, name: 'clinch (over+under vs tricep+under)' },
      { type: 'transition', id: 452, name: 'get body lock' },
      { type: 'transition', id: 68, name: 'flank (body lock w/ arm trapped)' },
      { type: 'transition', id: 1150, name: 'sacrifice throw' },
      { type: 'transition', id: 12, name: 'jailbreak' },
      { type: 'transition', id: 822, name: 'recover guard (over/under cocoon)' },
      { type: 'transition', id: 14, name: 'retract underhook (cocoon w/ overhook)' },
      { type: 'transition', id: 354, name: 'butterfly w/ whizzer' },
      { type: 'transition', id: 355, name: 'dogfight w/o leg control' },
      { type: 'transition', id: 1086, name: 'transition to triangle setup' },
      { type: 'transition', id: 1085, name: 'triangle threat' },
      { type: 'transition', id: 78, name: 'locked triangle' },
      { type: 'transition', id: 87, name: 'triangle perpendicular angle' },
      { type: 'transition', id: 79, name: 'perpendicular triangle' },
      { type: 'transition', id: 1206, name: 'tap' }
    ]
  }
};

const CATEGORY_COLORS = {
  'Throw': '#ff6b6b',
  'Takedown': '#ffeaa7',
  'Chain': '#74b9ff'
};

export default function SequenceBuilder() {
  const [sequence, setSequence] = useState(PREDEFINED_SEQUENCES.uchimata.items);
  const [playbackSpeed, setPlaybackSpeed] = useState(8.0);
  const [manualInput, setManualInput] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLooping, setIsLooping] = useState(true);

  const [sequenceData, setSequenceData] = useState({ frames: [], markers: [], meta: { totalFrames: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isEmbedded = window.self !== window.top;

  const loadSequenceData = useCallback(async () => {
    try {
      const response = await fetch('/sequence.json');
      if (response.ok) {
        const data = await response.json();
        if (data && data.frames) {
          setSequenceData(data);
          setError(null);
        }
      }
    } catch (err) {
      console.error('Failed to load sequence:', err);
    }
  }, []);

  useEffect(() => {
    loadSequenceData();
  }, [loadSequenceData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const frames = sequenceData.frames || [];
  const markers = sequenceData.markers || [];

  const extractSequence = async (sequenceSpec) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence: sequenceSpec })
      });
      if (response.ok) {
        const data = await response.json();
        setSequenceData(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to extract sequence');
      }
    } catch (err) {
      setError(err.message || 'Failed to extract sequence');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPredefined = async (key) => {
    if (PREDEFINED_SEQUENCES[key]) {
      const items = PREDEFINED_SEQUENCES[key].items;
      setSequence(items);
      await extractSequence(items);
    }
  };

  const parseManualInput = (input) => {
    const parts = input.split(/[,\s]+/).filter(Boolean);
    const items = [];
    for (const part of parts) {
      const match = part.match(/^[pt](\d+)$/i);
      if (match) {
        const type = part[0].toLowerCase() === 'p' ? 'position' : 'transition';
        items.push({ type, id: parseInt(match[1]), name: `${type} ${match[1]}` });
      }
    }
    return items;
  };

  const applyManualSequence = async () => {
    const items = parseManualInput(manualInput);
    if (items.length > 0) {
      setSequence(items);
      await extractSequence(items);
    } else {
      setError('Invalid format. Use: p557,t1383,p558');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: isEmbedded ? 'transparent' : '#F5F1E8' }}>

      {/* LEFT SIDEBAR - Hide in embed mode */}
      {!isEmbedded && (
        <div style={{ width: '340px', background: 'white', borderRight: '1px solid #E5E5E5', display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #E5E5E5' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>GrappleMap</h2>
          </div>

          {/* SEQUENCES - Always visible */}
          <div style={{ padding: '12px', borderBottom: '1px solid #E5E5E5', background: '#FAFAFA' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Sequences
            </h3>
            {Object.entries(PREDEFINED_SEQUENCES).map(([key, seq]) => (
              <button
                key={key}
                onClick={() => loadPredefined(key)}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '6px',
                  background: '#FFFFFF',
                  border: '1px solid #DDD',
                  borderRadius: '6px',
                  cursor: isLoading ? 'wait' : 'pointer',
                  textAlign: 'left',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontWeight: 600,
                    background: CATEGORY_COLORS[seq.category] || '#E5E5E5'
                  }}>
                    {seq.category}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>{seq.name}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>{seq.items.length} items</div>
              </button>
            ))}
          </div>

          {/* Scrollable area */}
          <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>

            {/* Manual Input */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>Manual Input</h4>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  placeholder="p557,t1383,p558"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyManualSequence()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #DDD',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
                <button
                  onClick={applyManualSequence}
                  disabled={isLoading || !manualInput.trim()}
                  style={{
                    padding: '8px 12px',
                    background: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Load
                </button>
              </div>
            </div>

            {/* Current Sequence */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#888', textTransform: 'uppercase' }}>
                Current ({sequence.length} items)
              </h4>
              {sequence.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '6px 8px',
                    marginBottom: '4px',
                    background: item.type === 'position' ? '#F5F5F5' : '#EFEFEF',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>
                    <span style={{ color: '#888', marginRight: '6px' }}>{index + 1}.</span>
                    <span style={{ fontWeight: 500 }}>{item.type === 'position' ? 'P' : 'T'}{item.id}</span>
                  </span>
                  <button
                    onClick={() => setSequence(prev => prev.filter((_, i) => i !== index))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CCC', fontSize: '12px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          {isLoading && <div style={{ padding: '8px', background: '#E3F2FD', fontSize: '12px', textAlign: 'center' }}>Loading...</div>}
          {error && (
            <div style={{ padding: '8px', background: '#FFEBEE', fontSize: '12px', color: '#C62828' }}>
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* RIGHT - Preview */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Controls - Hide in embed mode */}
        {!isEmbedded && (
          <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #E5E5E5', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: isPlaying ? '#333' : '#4CAF50',
                color: 'white',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              onClick={() => setIsLooping(!isLooping)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #CCC',
                background: isLooping ? '#333' : 'white',
                color: isLooping ? 'white' : '#333',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ⟳ Loop
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>Speed:</span>
              <input
                type="range"
                min="0.5"
                max="16"
                step="0.5"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                style={{ width: '80px' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{playbackSpeed.toFixed(1)}x</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} />
              FPS
            </label>
            <span style={{ fontSize: '12px', color: '#888' }}>{frames.length} frames</span>
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, background: isEmbedded ? 'transparent' : 'inherit' }}>
          {frames.length > 0 ? (
            <UchimataCard
              scene={{ frames }}
              playbackSpeed={playbackSpeed}
              showStats={showStats}
              isPlaying={isPlaying}
              isLooping={isLooping}
              style={{ height: '100%', width: '100%' }}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
              Select a sequence to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
