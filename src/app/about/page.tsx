import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import {
  Factory,
  Cpu,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Our Print Atelier | Purple Friday",
  description:
    "The craft, machinery, and story behind Purple Friday. In-house manufacturing roots in Bengaluru and Tirupur, zero middlemen, and proof-ready precision.",
};

const EQUIPMENT = [
  {
    name: "Tajima 14-Head High-Density Embroidery",
    origin: "Nagoya, Japan",
    spec: "1,200 stitches/min • 12 spot colors per head",
    desc: "Industrial precision embroidery for structured caps, heavy fleece hoodies, and corporate piqué polos with zero thread snags.",
  },
  {
    name: "Brother GTX Pro Direct-to-Garment System",
    origin: "Tokyo, Japan",
    spec: "1200x1200 DPI • Water-based certified Innobella inks",
    desc: "High-definition micro-droplet inkjet technology capturing fine photographic artwork and gradient blends on bio-washed cotton.",
  },
  {
    name: "Fiber Laser Rotary Engraving Rig",
    origin: "Biel, Switzerland",
    spec: "30W Fiber • Rotary chuck for 360° cylindrical etch",
    desc: "Sub-millimeter laser ablation stripping powder-coat to gleaming golden brass on rollerball pens and stainless steel flasks.",
  },
  {
    name: "Dual-Platen Pneumatic Heat Press",
    origin: "Milan, Italy",
    spec: "Air-actuated • 6 Bar constant pressure at 165°C",
    desc: "Even thermal bond curing ensuring DTF and vinyl prints withstand 50+ commercial washing machine cycles without edge lift.",
  },
];

const VALUES = [
  {
    num: "01",
    title: "100% Pre-Print Approval",
    desc: "We never start pressing or stitching without your explicit WhatsApp/email signoff on exact 1:1 scale digital proofs.",
  },
  {
    num: "02",
    title: "Direct-From-Floor Pricing",
    desc: "No brokers, no drop-shipping markups. You deal directly with the master pressmen executing your apparel and badge orders.",
  },
  {
    num: "03",
    title: "Zero Fabric Damage Fasteners",
    desc: "Our signature lapel badges use N42 neodymium rare-earth magnets, completely eliminating puncture holes in premium suiting.",
  },
  {
    num: "04",
    title: "Calibrated Spot Colors",
    desc: "Color calibrated to ISO 12647-2 standards tested under 5000K daylight simulation booths. If it doesn't match proof tolerance, we reprint free.",
  },
];

const TEAM = [
  {
    name: "Anand Ranganathan",
    role: "Head of Pre-Press & Typography",
    exp: "18 years in offset proofing & color calibration",
  },
  {
    name: "Kavitha Murugesan",
    role: "Textile Engineering Director (Tirupur)",
    exp: "Specialist in 100% combed cottons & Tajima embroidery",
  },
  {
    name: "Farhan Qureshi",
    role: "Master Laser & Precision Metals Engineer",
    exp: "Pioneer in dual-magnet NdFeB badge fabrication",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-pf-paper pb-24">
      {/* 1. Hero Narrative Block */}
      <section className="relative border-b-2 border-pf-ink bg-white py-20 px-4 md:px-8 overflow-hidden">
        {/* Registration Marks Motif */}
        <span className="absolute top-4 left-4 font-mono text-xs text-pf-ink/30 select-none">
          + ATELIER FOUNDATIONS // BENGALURU & TIRUPUR
        </span>
        <span className="absolute top-4 right-4 font-mono text-xs text-pf-ink/30 select-none">
          EST. 2021 +
        </span>

        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 border border-pf-ink/20 bg-pf-lime px-3 py-1 text-xs font-mono font-bold text-pf-ink uppercase tracking-wider shadow-[2px_2px_0_0_#15101F]">
            <Factory className="h-3.5 w-3.5" />
            Our Story & Craft
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-pf-ink tracking-tight leading-[1.08]">
            An editorial print-shop for <br className="hidden sm:inline" />
            teams who care about details.
          </h1>

          <p className="text-base sm:text-lg font-sans text-pf-ink/75 leading-relaxed max-w-3xl mx-auto">
            Purple Friday was founded with a single obsession: custom merchandise shouldn&apos;t feel like throwaway plastic promotional junk. We combined the tactile craft of traditional offset-press proofing with modern high-speed Japanese embroidery and direct-to-garment machinery.
          </p>
        </div>
      </section>

      {/* 2. Manufacturing Roots (Bengaluru & Tirupur) */}
      <section className="border-b-2 border-pf-ink bg-pf-paper py-16 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
                Our Physical Roots
              </span>
              <h2 className="font-display text-3xl font-extrabold text-pf-ink">
                Built where Indian textile and hardware craft lives.
              </h2>
              <p className="font-sans text-sm text-pf-ink/75 leading-relaxed">
                Apparel requires the world-famous cotton spinning and bio-wash heritage of <strong>Tirupur, Tamil Nadu</strong>. Precision hardware, NdFeB neodymium magnet assemblies, and high-frequency laser etching require the deep precision-machining ecosystem of <strong>Bengaluru, Karnataka</strong>.
              </p>
              <p className="font-sans text-sm text-pf-ink/75 leading-relaxed">
                By operating our own production lines across both cities, we eliminate the 3 to 4 broker markups typical of traditional corporate gifting aggregators.
              </p>
            </div>

            <div className="border-2 border-pf-ink bg-white p-6 shadow-[5px_5px_0_0_#15101F] space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-pf-ink/15 pb-3">
                <span className="font-bold text-pf-ink">Atelier Unit 1 (Heavy Textile)</span>
                <span className="text-pf-violet font-bold">Tirupur, TN</span>
              </div>
              <p className="text-pf-ink/70 font-sans text-xs">
                240 GSM French terry knitting, 180 GSM bio-wash baths, and Japanese Tajima multi-head embroidery lines.
              </p>

              <div className="flex items-center justify-between border-b border-pf-ink/15 pb-3 pt-2">
                <span className="font-bold text-pf-ink">Atelier Unit 2 (Metals & Pre-Press)</span>
                <span className="text-pf-violet font-bold">Bengaluru, KA</span>
              </div>
              <p className="text-pf-ink/70 font-sans text-xs">
                NdFeB magnetic lapel badge die-cutting, 360° rotary laser etching, and 1:1 scale proofing signoff lab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Factory Equipment Tour */}
      <section className="border-b-2 border-pf-ink bg-white py-20 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
              On the Floor
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-pf-ink mt-1">
              Industrial machinery, artisan calibration
            </h2>
            <p className="text-sm font-sans text-pf-ink/75 mt-2">
              Every badge, hoodie, and pen passes through calibrated hardware inspected daily by master pressmen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {EQUIPMENT.map((eq) => (
              <article
                key={eq.name}
                className="border-2 border-pf-ink bg-pf-paper p-6 shadow-[4px_4px_0_0_#15101F] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-pf-violet uppercase bg-pf-violet/10 px-2 py-0.5 border border-pf-violet/20">
                      {eq.origin}
                    </span>
                    <Cpu className="h-4 w-4 text-pf-ink/40" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-pf-ink mb-1">
                    {eq.name}
                  </h3>
                  <div className="font-mono text-xs text-pf-ink/60 mb-3">{eq.spec}</div>
                  <p className="font-sans text-xs text-pf-ink/75 leading-relaxed">{eq.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Four Core Values (Numbered Cards) */}
      <section className="border-b-2 border-pf-ink bg-pf-paper py-20 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
              Our Principles
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-pf-ink mt-1">
              The four Purple Friday quality gates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val) => (
              <div
                key={val.num}
                className="border-2 border-pf-ink bg-white p-6 shadow-[4px_4px_0_0_#15101F] flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-3xl font-black text-pf-violet block mb-2">
                    {val.num}
                  </span>
                  <h3 className="font-display text-lg font-bold text-pf-ink mb-2">
                    {val.title}
                  </h3>
                  <p className="font-sans text-xs text-pf-ink/75 leading-relaxed">{val.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Production Team Section */}
      <section className="bg-white py-20 px-4 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-mono text-xs uppercase font-bold text-pf-violet tracking-wider">
              Leadership
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-pf-ink mt-1">
              Meet the master pressmen
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="border-2 border-pf-ink bg-pf-paper p-6 shadow-[3px_3px_0_0_#15101F]"
              >
                <div className="h-12 w-12 rounded-full border-2 border-pf-ink bg-pf-violet text-white flex items-center justify-center font-mono font-bold text-lg mb-4">
                  {member.name[0]}
                </div>
                <h3 className="font-display text-lg font-bold text-pf-ink">{member.name}</h3>
                <span className="font-mono text-xs text-pf-violet font-semibold block mt-0.5">
                  {member.role}
                </span>
                <p className="font-sans text-xs text-pf-ink/75 mt-2">{member.exp}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/collections/all"
              className="inline-flex items-center gap-2 border-2 border-pf-ink bg-pf-violet text-white font-mono text-xs font-bold uppercase tracking-wider px-6 py-3.5 shadow-[4px_4px_0_0_#15101F] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <span>Explore Our Merchandise Blanks</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
