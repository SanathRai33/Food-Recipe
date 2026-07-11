import React from 'react';
import { FaGithub, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container-custom py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="text-2xl">🍳</span>
            <span className="text-lg font-semibold text-gray-700">RecipeShare</span>
            <span className="text-sm text-gray-500 ml-2">
              © {new Date().getFullYear()}
            </span>
          </div>
          
          <div className="flex items-center space-x-6">
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <FaTwitter size={20} />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <FaGithub size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;