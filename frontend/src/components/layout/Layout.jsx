import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 w-full">
      <Navbar />
      <main className="flex-grow container-custom py-8 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;