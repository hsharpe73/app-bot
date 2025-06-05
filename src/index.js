import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatBot from './components/ChatBot';
import VersionChecker from './components/VersionChecker';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <>
    <VersionChecker />
    <ChatBot />
  </>
);
