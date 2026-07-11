import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <AdminNavbar />
      <main className="flex-grow container-custom py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;