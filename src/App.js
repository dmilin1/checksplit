import React from 'react';

import GlobalContextProvider from './contexts/GlobalContext';
import Router from './router';

import './App.css';

function App() {
  return (
    <GlobalContextProvider>
      <div style={{
        flex: 1,
        maxWidth: '100vw',
        minHeight: '-webkit-fill-available',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
      }}
      >
        <Router />
      </div>
    </GlobalContextProvider>
  );
}

export default App;
