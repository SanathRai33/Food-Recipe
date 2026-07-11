import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';

const AdminNavbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">⚙️</span>
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
            >
              <FaArrowLeft className="mr-1" />
              Back to App
            </Link>
            <Link
              to="/admin/users"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Users
            </Link>
            <Link
              to="/admin/recipes"
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              Recipes
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center text-red-400 hover:text-red-300 transition-colors duration-200"
            >
              <FaSignOutAlt className="mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;