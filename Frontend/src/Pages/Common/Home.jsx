import React from 'react'
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">
        Welcome to Quotation Management System
      </h1>
      <p className="text-lg text-gray-600 max-w-xl mb-6">
        Manage your hostel’s item requirements, collect retailer quotations, and 
        choose the best suppliers all in one place. 
      </p>
      <div className="flex space-x-4">
        <Link to='/login' className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl shadow hover:bg-gray-300 transition">LOGIN</Link>
      </div>
    </div>
  );
};

export default Home;
