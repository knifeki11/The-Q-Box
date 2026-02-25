"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "Stations", href: "#stations" },
  { label: "Pricing", href: "#pricing" },
  { label: "Tournaments", href: "#tournaments" },
  { label: "Contact", href: "#contact" },
];

const SCROLL_THRESHOLD = 60;
const SCROLL_HIDE_THRESHOLD = 80;

const SECTION_IDS = navLinks.map((l) => l.href.slice(1)).filter(Boolean);

function getActiveSectionFromScroll(): string {
  if (typeof window === "undefined") return "#home";
  const threshold = 120;
  let best = "#home";
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= threshold && rect.bottom > 0) best = `#${id}`;
  }
  return best;
}

export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled(y > SCROLL_THRESHOLD);
      setActiveHash(getActiveSectionFromScroll());
      if (y <= SCROLL_HIDE_THRESHOLD) {
        setVisible(true);
      } else if (y > lastScrollY.current) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = y;
    };
    const handleHashChange = () => {
      setActiveHash(window.location.hash || "#home");
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);
    setActiveHash(window.location.hash || getActiveSectionFromScroll());
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: visible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 px-3 pt-2 md:px-5 md:pt-2.5"
      >
        <div
          className={`navbar-glass mx-auto flex max-w-6xl items-center justify-between px-4 py-2 transition-[padding] duration-300 md:px-6 md:py-2.5 ${
            scrolled ? "navbar-glass-scrolled py-1.5 md:py-2" : ""
          }`}
        >
          {/* Left: Logo – ~25% larger, hover glow */}
          <a
            href="#home"
            className="navbar-logo-link flex shrink-0 items-center"
            aria-label="Q-BOX Home"
          >
            <Image
              src="/images/QBOX_logo_upscaled.png"
              alt="THE Q-BOX PLAY LOUNGE"
              width={320}
              height={137}
              className="h-9 w-auto object-contain sm:h-10 md:h-11 lg:h-12"
              priority
            />
          </a>

          {/* Center: Nav links – smaller, muted silver, active orange */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {navLinks.map((link) => {
              const isActive =
                (link.href === "#home" && !activeHash) ||
                (link.href !== "#home" && activeHash === link.href);
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`navbar-link ${isActive ? "navbar-link-active" : ""}`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Right: Login + Book Now */}
          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="/login"
              className="navbar-btn-login px-3.5 py-1.5 text-xs"
              aria-label="Login"
            >
              Login
            </a>
            <a
              href="/book"
              className="navbar-btn-book px-4 py-2 text-sm"
              aria-label="Book Now"
            >
              Book Now
            </a>
          </div>

          {/* Mobile: Hamburger – keep Book Now visible next to menu if space allows */}
          <div className="flex items-center gap-2 lg:hidden">
            <a
              href="/book"
              className="navbar-btn-book px-3.5 py-1.5 text-xs"
              aria-label="Book Now"
            >
              Book Now
            </a>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-2 text-[rgba(200,204,212,0.95)] transition-colors hover:bg-white/10 hover:text-white"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu – same glass bar look */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="navbar-glass fixed left-3 right-3 top-20 z-40 mx-auto max-w-6xl rounded-2xl border border-white/15 px-5 py-6 shadow-xl lg:hidden"
            style={{
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navLinks.map((link) => {
                const isActive =
                  (link.href === "#home" && !activeHash) ||
                  (link.href !== "#home" && activeHash === link.href);
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`navbar-link rounded-lg px-3 py-2.5 text-base ${isActive ? "navbar-link-active" : ""}`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-white/15 pt-4">
              <a
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="navbar-btn-login py-2.5 text-center"
              >
                Login
              </a>
              <a
                href="/book"
                onClick={() => setMobileOpen(false)}
                className="navbar-btn-book py-3 text-center"
              >
                Book Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
