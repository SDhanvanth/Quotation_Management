import React from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar";
import Login from "./Pages/Auth/Login";
import NotFound from "./Pages/Common/NotFound";
import Home from './Pages/Common/Home';
import Register from './Pages/Auth/Register';
import ForgotPassword from './Pages/Auth/ForgotPassword';
import ItemList from "./Pages/Items/ItemList";
import AddItem from "./Pages/Items/AddItem";
import EditItem from "./Pages/Items/EditItem";

const router = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path="/items" element={<ItemList />} />
        <Route path="/items/add" element={<AddItem />} />
        <Route path="/items/edit/:id" element={<EditItem />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default router
