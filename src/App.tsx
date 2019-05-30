import React from 'react';
import './App.scss';
import { FullPageSketch } from './fullPageSketch';
import Mito from './sketches/mito';

const App: React.FC = () => {
  return (
    <div className="App">
      <FullPageSketch sketchClass={Mito} />
    </div>
  );
}

export default App;
