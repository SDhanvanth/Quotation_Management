import React from 'react'
import { useState } from 'react';

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);
    // 🔹 Call backend API here: POST /auth/login
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white shadow-lg rounded-2xl p-8 w-96"
      >
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          Login
        </h2>

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your username"
          required
        />

        <label className="block mb-2 text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your password"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login