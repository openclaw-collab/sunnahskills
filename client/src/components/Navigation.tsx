import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [location] = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProgramsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Programs", path: "/programs" },
    { name: "Schedule", path: "/schedule" },
    { name: "Testimonials", path: "/testimonials" },
    { name: "Contact", path: "/contact" },
  ];

  const programItems = [
    { name: "Brazilian Jiu-Jitsu", path: "/programs/bjj" },
    { name: "Archery", path: "/programs/archery" },
    { name: "Outdoor Workshops", path: "/programs/outdoor" },
    { name: "Bullyproofing", path: "/programs/bullyproofing" },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="font-poppins font-bold text-2xl text-primary">
                Sunnah Skills
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.slice(0, 1).map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                    location === item.path
                      ? "text-primary font-semibold"
                      : "text-gray-800 hover:text-primary"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Programs Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProgramsDropdownOpen(!programsDropdownOpen)}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1",
                    programItems.some(item => location === item.path)
                      ? "text-primary font-semibold"
                      : "text-gray-800 hover:text-primary"
                  )}
                >
                  Programs
                  <ChevronDown size={16} className={cn(
                    "transition-transform duration-200",
                    programsDropdownOpen ? "rotate-180" : ""
                  )} />
                </button>
                
                {programsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-50">
                    <div className="py-1">
                      <Link
                        href="/programs"
                        className={cn(
                          "block px-4 py-2 text-sm transition-colors duration-200 border-b border-gray-100",
                          location === "/programs"
                            ? "text-primary font-semibold bg-primary/5"
                            : "text-gray-800 hover:text-primary hover:bg-primary/5"
                        )}
                        onClick={() => setProgramsDropdownOpen(false)}
                      >
                        All Programs
                      </Link>
                      {programItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.path}
                          className={cn(
                            "block px-4 py-2 text-sm transition-colors duration-200",
                            location === item.path
                              ? "text-primary font-semibold bg-primary/5"
                              : "text-gray-800 hover:text-primary hover:bg-primary/5"
                          )}
                          onClick={() => setProgramsDropdownOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {navItems.slice(2).map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                    location === item.path
                      ? "text-primary font-semibold"
                      : "text-gray-800 hover:text-primary"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-800 hover:text-primary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            {navItems.slice(0, 1).map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200",
                  location === item.path
                    ? "text-primary font-semibold"
                    : "text-gray-800 hover:text-primary"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Programs Mobile Dropdown */}
            <div>
              <button
                onClick={() => setProgramsDropdownOpen(!programsDropdownOpen)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center justify-between",
                  programItems.some(item => location === item.path)
                    ? "text-primary font-semibold"
                    : "text-gray-800 hover:text-primary"
                )}
              >
                Programs
                <ChevronDown size={16} className={cn(
                  "transition-transform duration-200",
                  programsDropdownOpen ? "rotate-180" : ""
                )} />
              </button>
              
              {programsDropdownOpen && (
                <div className="pl-4 space-y-1">
                  <Link
                    href="/programs"
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm transition-colors duration-200 border-b border-gray-100",
                      location === "/programs"
                        ? "text-primary font-semibold"
                        : "text-gray-600 hover:text-primary"
                    )}
                    onClick={() => {
                      setIsOpen(false);
                      setProgramsDropdownOpen(false);
                    }}
                  >
                    All Programs
                  </Link>
                  {programItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={cn(
                        "block px-3 py-2 rounded-md text-sm transition-colors duration-200",
                        location === item.path
                          ? "text-primary font-semibold"
                          : "text-gray-600 hover:text-primary"
                      )}
                      onClick={() => {
                        setIsOpen(false);
                        setProgramsDropdownOpen(false);
                      }}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navItems.slice(2).map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200",
                  location === item.path
                    ? "text-primary font-semibold"
                    : "text-gray-800 hover:text-primary"
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
