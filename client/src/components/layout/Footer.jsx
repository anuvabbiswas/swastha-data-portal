import React from 'react';
import logo from '../../assets/logo1.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-5 text-center text-sm text-slate-500 border-t border-slate-200 bg-slate-50/50 mt-auto">
      <p className="flex items-center justify-center gap-2">
        <a
          href="https://swasthahospital.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Swastha Hospital website"
        >
          <img
            src={logo}
            alt="Swastha Hospital Logo"
            className="h-5 w-5 object-contain cursor-pointer"
          />
        </a>

        <span>
          &copy; {currentYear} Swastha Hospital (A Unit of Helse Medical Sciences Pvt. Ltd.). All Rights Reserved.
        </span>
      </p>
    </footer>
  );
}