import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { Foundations } from './showcase/Foundations';
import { Buttons } from './showcase/Buttons';
import { Forms } from './showcase/Forms';
import { DataDisplay } from './showcase/DataDisplay';
import { Feedback } from './showcase/Feedback';
import { Navigation } from './showcase/Navigation';
import { Overlays } from './showcase/Overlays';
import { Menu, X } from 'lucide-react';
import { Toaster } from 'sonner';
const SECTIONS = [
{
  id: 'foundations',
  label: 'Foundations'
},
{
  id: 'buttons',
  label: 'Buttons'
},
{
  id: 'forms',
  label: 'Forms'
},
{
  id: 'data-display',
  label: 'Data Display'
},
{
  id: 'feedback',
  label: 'Feedback'
},
{
  id: 'navigation',
  label: 'Navigation'
},
{
  id: 'overlays',
  label: 'Overlays'
}];

export function Layout() {
  const [activeSection, setActiveSection] = useState('foundations');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = SECTIONS.map((s) => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 100; // Offset for header
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between p-4">
        <div className="font-bold text-lg text-primary flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-background" />
          </div>
          Aurora ERP
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2">
          
          {isMobileMenuOpen ?
          <X className="h-6 w-6" /> :

          <Menu className="h-6 w-6" />
          }
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 border-r bg-background transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block',
          isMobileMenuOpen ?
          'translate-x-0 mt-[65px] md:mt-0' :
          '-translate-x-full'
        )}>
        
        <div className="h-full flex flex-col py-6">
          <div className="px-6 mb-8 hidden md:block">
            <div className="font-bold text-xl text-primary flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <div className="w-4 h-4 rounded-full bg-background" />
              </div>
              Aurora ERP
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-10">
              Design System v1.0
            </p>
          </div>
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {SECTIONS.map((section) =>
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                activeSection === section.id ?
                'bg-primary/10 text-primary' :
                'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
              
                {section.label}
              </button>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
          <Foundations />
          <Buttons />
          <Forms />
          <DataDisplay />
          <Feedback />
          <Navigation />
          <Overlays />
        </div>
      </main>
      <Toaster />
    </div>);

}