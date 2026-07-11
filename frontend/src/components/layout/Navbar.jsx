import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaUtensils, FaHeart, FaBookmark, FaPlus, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: null },
    { to: '/recipes', label: 'Recipes', icon: null },
    { to: '/create-recipe', label: 'Create Recipe', icon: <FaPlus className="mr-1" /> },
    { to: '/favorites', label: 'Favorites', icon: <FaHeart className="mr-1" /> },
    { to: '/collections', label: 'Collections', icon: <FaBookmark className="mr-1" /> },
    { to: '/activity-feed', label: 'Activity', icon: null },
    { to: '/profile', label: 'Profile', icon: <FaUser className="mr-1" /> },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin/dashboard', label: 'Admin', icon: null });
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">🍳</span>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              RecipeShare
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 flex items-center"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center text-red-500 hover:text-red-600 font-medium transition-colors duration-200"
            >
              <FaSignOutAlt className="mr-1" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 flex items-center px-2 py-1"
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center text-red-500 hover:text-red-600 font-medium transition-colors duration-200 px-2 py-1"
              >
                <FaSignOutAlt className="mr-1" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;