
import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
  transparentNavbar?: boolean;
}

export const Layout = ({ children, transparentNavbar = false }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-aptosNavy">
      <Navbar transparent={transparentNavbar} />
      <main>
        {children}
      </main>
      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-aptosCyan to-aptosPurple" />
              <span className="text-lg font-bold text-white">AptosGate</span>
            </div>
            <div className="text-aptosGray text-sm">
              © {new Date().getFullYear()} AptosGate. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
