import React from 'react'

import GlobalContextProvider from './contexts/GlobalContext.js';
import Router from './router.js';

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
            }}>
                <Router />
            </div>
        </GlobalContextProvider>
    );
}

export default App;