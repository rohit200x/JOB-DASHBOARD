import { useState, useEffect } from 'react';
import { NotificationProvider } from './components/Notification';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Dashboard />
        </main>
      </div>
    </NotificationProvider>
  );
}

export default App;
