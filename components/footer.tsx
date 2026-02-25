"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Instagram, X, Facebook } from "lucide-react";
import Image from "next/image";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "Stations", href: "#stations" },
  { label: "Pricing", href: "#pricing" },
  { label: "Tournaments", href: "#tournaments" },
];

const socials = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: X, href: "#", label: "X" },
  { icon: Facebook, href: "#", label: "Facebook" },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid gap-12 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Image
                src="/images/QBOX_logo_upscaled.png"
                alt="THE Q-BOX PLAY LOUNGE"
                width={320}
                height={140}
                className="h-32 w-auto object-contain"
              />
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The future of gaming is here. Premium PS5 stations, competitive
              play, and the ultimate experience.
            </p>
            <div className="flex gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all duration-300 hover:border-primary hover:text-primary"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h4>
            <div className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                123 Gaming District, Downtown
              </span>
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                +1 (555) 123-4567
              </span>
              <span className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                hello@qboxlounge.com
              </span>
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              Opening Hours
            </h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">Mon - Thu:</strong> 12:00
                  PM - 12:00 AM
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">Fri - Sat:</strong> 12:00
                  PM - 2:00 AM
                </span>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">Sunday:</strong> 2:00 PM -
                  11:00 PM
                </span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {"\u00A9"} {new Date().getFullYear()} Q-BOX Play Lounge. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
