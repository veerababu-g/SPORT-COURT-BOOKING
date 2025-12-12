import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Menu, X } from 'lucide-react';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';

const NavBar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path ? "bg-indigo-700 text-white" : "text-indigo-100 hover:bg-indigo-600";

  return (
    <nav className="bg-indigo-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-white text-xl">
              <CalendarDays className="h-6 w-6" />
              <span>SPORT COURT BOOKING</span>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}>
                Book a Court
              </Link>
              <Link to="/admin" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/admin')}`}>
                Admin Dashboard
              </Link>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-indigo-700 inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/' ? "bg-indigo-900 text-white" : "text-indigo-100"}`}
            >
              Book a Court
            </Link>
            <Link 
              to="/admin" 
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === '/admin' ? "bg-indigo-900 text-white" : "text-indigo-100"}`}
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <NavBar />
        <main className="flex-grow container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<BookingPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-500 text-sm">
          <p>© 2024 CourtConnect. All rights reserved.</p>
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;