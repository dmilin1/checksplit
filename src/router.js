import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Start from './pages/start.js';
import Setup from './pages/setup.js';
import Room from './pages/room.js';


function Router() {

	return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start/>}/>
        <Route path="/setup" element={<Setup/>}/>
        <Route path="/room/:roomId" element={<Room/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default Router;