"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin, XIcon } from "lucide-react";
import logoston from "./logoston.png";

export default function Footer() {
  return (
    <footer className="relative z-20 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 text-gray-900 border-t border-gray-300">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src={logoston}
                alt="Stond Emporium Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <h3 className="text-xl font-bold">Stond Emporium</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Discover India&apos;s finest innovations. Premium, sustainable,
              and innovative products from top Indian startups.
            </p>
            <div className="flex gap-3">
              <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <XIcon className="w-4 h-4 text-gray-700" />
              </button>
              <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <XIcon className="w-4 h-4 text-gray-700" />
              </button>
              <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                <XIcon className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-orange-500">
              Get in Touch
            </h4>
            <div className="space-y-3">
              <a
                href="mailto:customercare@stondemporium.tech"
                className="flex items-center gap-3 text-gray-700 hover:text-orange-500 transition-colors group"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Mail className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email Us</p>
                  <p className="text-xs text-gray-500">
                    customercare@stondemporium.tech
                  </p>
                </div>
              </a>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Call Us</p>
                  <p className="text-xs text-gray-500">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Visit Us</p>
                  <p className="text-xs text-gray-500">Mumbai, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-orange-500">
              Quick Links
            </h4>
            <div className="space-y-2">
              <Link
                href="/products"
                className="block text-gray-700 hover:text-orange-500 transition-colors text-sm"
              >
                → All Products
              </Link>
              <Link
                href="/about-us"
                className="block text-gray-700 hover:text-orange-500 transition-colors text-sm"
              >
                → About Us
              </Link>
              <div className="block text-gray-400 cursor-not-allowed text-sm">
                → Contact (Coming Soon)
              </div>
              <div className="block text-gray-400 cursor-not-allowed text-sm">
                → Shipping & Returns (Coming Soon)
              </div>
              <div className="block text-gray-400 cursor-not-allowed text-sm">
                → FAQ (Coming Soon)
              </div>
              <Link
                href="/auth/register"
                className="block text-gray-700 hover:text-orange-500 transition-colors text-sm"
              >
                → Become a seller
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 mt-8 pt-6 text-center">
          <p className="text-gray-600 text-sm">
            © 2026 Stond Emporium. All rights reserved. |
            <span className="text-orange-500">Crafted with ❤️ in India</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
