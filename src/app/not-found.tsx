import React from "react";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { RegistrationMark, CropCorners, HalftoneBackground } from "@/components/ui/decorative";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-paper relative overflow-hidden">
      <div className="max-w-xl w-full border-2 border-ink bg-paper-pure p-8 sm:p-12 rounded-sm shadow-stamp relative text-center space-y-6">
        <HalftoneBackground variant="subtle" />
        <CropCorners offset={10} length={14} />

        <div className="flex items-center justify-center gap-2 text-violet">
          <RegistrationMark size={20} variant="violet" />
          <span className="font-mono text-xs uppercase tracking-widest font-bold">
            Offset Plate 404 • Missing Impression
          </span>
        </div>

        <div className="space-y-2 relative z-10">
          <span className="font-display font-black text-6xl sm:text-7xl text-ink tracking-tight block">
            404
          </span>
          <h1 className="heading-sub font-bold text-ink">
            This Press Plate Does Not Exist
          </h1>
          <p className="text-sm font-sans text-ink/70 max-w-md mx-auto leading-relaxed">
            The merchandise page or customized design link you requested has either been moved, renamed, or retired from the active press run.
          </p>
        </div>

        {/* Quick Recovery Links */}
        <div className="pt-4 border-t border-ink/15 space-y-3 relative z-10">
          <p className="font-mono text-xs uppercase tracking-wider font-semibold text-ink/80">
            Explore Active Print Categories:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Magnetic Badges", href: "/category/magnetic-badges" },
              { label: "Custom Tees", href: "/category/t-shirts" },
              { label: "Polo Shirts", href: "/category/polo-shirts" },
              { label: "Hoodies", href: "/category/hoodies" },
              { label: "Caps", href: "/category/caps" },
              { label: "Corporate Kits", href: "/category/corporate-gifts" },
            ].map((cat) => (
              <Link key={cat.href} href={cat.href}>
                <Button variant="ghost" size="sm">
                  {cat.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
          <Link href="/">
            <Button variant="stamp" leftIcon={<Home className="h-4 w-4" />}>
              Return to Homepage
            </Button>
          </Link>
          <Link href="/category/best-sellers">
            <Button variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Browse Best Sellers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

