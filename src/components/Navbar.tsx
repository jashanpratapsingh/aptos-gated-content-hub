
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { WalletSelector } from './WalletSelector';

interface NavbarProps {
  transparent?: boolean;
}

export const Navbar = ({ transparent = false }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`w-full z-50 ${transparent ? 'absolute top-0 left-0' : 'bg-aptosNavy'}`}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-aptosCyan to-aptosPurple" />
          <span className="text-xl font-bold text-white">AptosGate</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white hover:text-aptosCyan transition-colors">
            Home
          </Link>
          <Link to="/explore" className="text-white hover:text-aptosCyan transition-colors">
            Explore
          </Link>
          <Link to="/dashboard" className="text-white hover:text-aptosCyan transition-colors">
            Dashboard
          </Link>
          
          <WalletSelector />
        </div>
        
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-white hover:text-aptosCyan transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/explore" 
              className="text-white hover:text-aptosCyan transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Explore
            </Link>
            <Link 
              to="/dashboard" 
              className="text-white hover:text-aptosCyan transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <div className="py-2">
              <WalletSelector />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
