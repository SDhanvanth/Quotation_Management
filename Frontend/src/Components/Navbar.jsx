import React from 'react'
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
      <div className="text-xl font-bold">
        HIMS
      </div>
      <ul className="flex gap-6">
        <li>
          <Link to="/" className="hover:text-gray-200">Home</Link>
        </li>
        <li>
          <Link to="/login" className="hover:text-gray-200">Login</Link>
        </li>
        <li>
          <Link to="/register" className="hover:text-gray-200">Register</Link>
        </li>
        <li>
          <Link to="/profile" className="hover:text-gray-200">Profile</Link>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar