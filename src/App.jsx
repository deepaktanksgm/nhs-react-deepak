"use client"

import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import { Toaster } from "react-hot-toast"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Toaster position="top-right" reverseOrder={false} />
    </Router>
  );
}
