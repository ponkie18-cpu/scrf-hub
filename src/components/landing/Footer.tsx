import { Link } from "react-router-dom";
import scrfLogo from "@/assets/SCRF_Logo.png";

const Footer = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="bg-foreground text-background py-12 px-4 md:px-8">
      <div className="container max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <img src={scrfLogo} alt="SCRF Hub by Tsa Dinaledi" className="h-16 w-auto mb-3" />
            <p className="font-semibold mb-2">SCRF Hub by Tsa Dinaledi</p>
            <p className="text-background/70 mb-4 max-w-sm">
              A self-serve SME resilience SaaS platform helping South African businesses
              assess operational, financial, compliance, strategic, and cyber risks.
            </p>
            <a href="mailto:scrf@tsadinaledi.co.za" className="text-sm text-background/80 hover:text-background underline">
              scrf@tsadinaledi.co.za
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><button onClick={() => scrollToSection("how-it-works")} className="text-background/70 hover:text-background transition-colors">How It Works</button></li>
              <li><button onClick={() => scrollToSection("tools")} className="text-background/70 hover:text-background transition-colors">Tools</button></li>
              <li><button onClick={() => scrollToSection("pricing")} className="text-background/70 hover:text-background transition-colors">Pricing</button></li>
              <li><button onClick={() => scrollToSection("about")} className="text-background/70 hover:text-background transition-colors">About</button></li>
              <li><button onClick={() => scrollToSection("contact")} className="text-background/70 hover:text-background transition-colors">Contact</button></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-display font-semibold mb-4">Legal & Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/terms-of-service" className="text-background/70 hover:text-background transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-background/70 hover:text-background transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-background/70 hover:text-background transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/cancellation-policy" className="text-background/70 hover:text-background transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-background/70 hover:text-background transition-colors">
                  Give Feedback
                </Link>
              </li>
              <li>
                <button onClick={() => scrollToSection("contact")} className="text-background/70 hover:text-background transition-colors">
                  Get Help
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © 2026 SCRF. All rights reserved.
          </p>
          <p className="text-xs text-background/40">
            Framework based on research integrating Mental Accounting, Slippery Slope Framework, and ISO 31000.
          </p>
        </div>
        <div className="mt-4 text-center max-w-3xl mx-auto">
          <p className="text-[11px] text-background/50 leading-relaxed">
            SCRF Hub provides business resilience diagnostics and decision-support
            guidance. It does not provide tax, legal, audit, investment, or regulated
            financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
