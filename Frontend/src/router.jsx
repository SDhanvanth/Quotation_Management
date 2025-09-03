import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Login from "./Pages/Auth/Login";
import NotFound from "./Pages/Common/NotFound";

const router = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<h1 className="p-6 text-2xl">Home Page</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<h1 className="p-6 text-2xl">Register Page</h1>} />
        <Route path="/profile" element={<h1 className="p-6 text-2xl">Profile Page</h1>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default router
