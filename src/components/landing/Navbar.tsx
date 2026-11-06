import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Crown, BookOpen } from "lucide-react";
import scrfLogo from "@/assets/SCRF_Logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useTierAccess } from "@/hooks/useTierAccess";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "How It Works", href: "how-it-works" },
  { label: "Tools", href: "tools" },
  { label: "Pricing", href: "pricing" },
  { label: "About", href: "about" },
  { label: "Contact", href: "contact" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { tier } = useTierAccess();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (!isHomePage) {
      // Navigate to home and then scroll
      window.location.href = `/#${id}`;
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (isHomePage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2"
          >
            <img src={scrfLogo} alt="SCRF Hub" className="h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
            {!loading && user ? (
              <div className="flex items-center gap-2">
                {tier === 'pro' ? (
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    <Crown className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <BookOpen className="h-3 w-3 mr-1" />
                    Free
                  </Badge>
                )}
                <Button size="sm" onClick={() => navigate("/dashboard")}>
                  <User className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/auth")}>
                  Start Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b shadow-lg animate-fade-in">
            <div className="flex flex-col p-4 gap-2">
              <div>
                {navItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="text-left w-full py-3 px-4 rounded-lg text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {user ? (
                <Button className="mt-2" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="mt-2" onClick={() => navigate("/auth")}>
                    Login
                  </Button>
                  <Button onClick={() => navigate("/auth")}>
                    Start Free
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
