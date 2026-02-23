import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TimerPage from './pages/TimerPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<TimerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
