import React, { Suspense, lazy } from 'react';
import SequenceBuilder from './SequenceBuilder';

function App() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#F5F1E8'
    }}>
      <SequenceBuilder />
    </div>
  );
}

export default App;
