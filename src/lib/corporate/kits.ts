export interface KitProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  mrp: number;
  basePrice: number;
  bulkPrice50: number; // Tier price for 50+ units
  bulkPrice250: number; // Tier price for 250+ units
  image: string;
}

export const CORPORATE_CATALOG: Record<string, KitProduct> = {
  badge: {
    id: "round-gloss-badge-58mm",
    name: "58mm Round Gloss Magnetic Badge",
    slug: "round-gloss-badge-58mm",
    category: "Magnetic Badges",
    mrp: 140,
    basePrice: 85,
    bulkPrice50: 55,
    bulkPrice250: 45,
    image: "/templates/badge-gloss.svg",
  },
  tee: {
    id: "heavyweight-oversized-tee-240gsm",
    name: "240 GSM Heavyweight Oversized Cotton T-Shirt",
    slug: "heavyweight-oversized-tee-240gsm",
    category: "Apparel",
    mrp: 899,
    basePrice: 480,
    bulkPrice50: 360,
    bulkPrice250: 310,
    image: "/templates/tee-heavy.svg",
  },
  polo: {
    id: "classic-pique-polo-220gsm",
    name: "Classic 220 GSM Combed Cotton Piqué Polo",
    slug: "classic-pique-polo-220gsm",
    category: "Apparel",
    mrp: 999,
    basePrice: 580,
    bulkPrice50: 440,
    bulkPrice250: 390,
    image: "/templates/polo-pique.svg",
  },
  cap: {
    id: "structured-cotton-twill-cap",
    name: "Structured 6-Panel Cotton Twill Baseball Cap",
    slug: "structured-cotton-twill-cap",
    category: "Caps",
    mrp: 499,
    basePrice: 278,
    bulkPrice50: 185,
    bulkPrice250: 150,
    image: "/templates/cap-twill.svg",
  },
  flask: {
    id: "matte-insulated-steel-flask",
    name: "Double-Wall Insulated Matte Steel Flask (750ml)",
    slug: "matte-insulated-steel-flask",
    category: "Drinkware",
    mrp: 899,
    basePrice: 480,
    bulkPrice50: 350,
    bulkPrice250: 295,
    image: "/templates/bottle-matte.svg",
  },
  journal: {
    id: "soft-touch-a5-journal",
    name: "A5 Hardcover Soft-Touch Executive Journal",
    slug: "soft-touch-a5-journal",
    category: "Stationery",
    mrp: 499,
    basePrice: 260,
    bulkPrice50: 195,
    bulkPrice250: 165,
    image: "/templates/notebook-matte.svg",
  },
  pen: {
    id: "brass-rollerball-pen",
    name: "Matte Black Brass Executive Rollerball Pen",
    slug: "brass-rollerball-pen",
    category: "Writing Instruments",
    mrp: 350,
    basePrice: 195,
    bulkPrice50: 135,
    bulkPrice250: 110,
    image: "/templates/pen-matte.svg",
  },
  hoodie: {
    id: "premium-heavyweight-hoodie-380gsm",
    name: "380 GSM Heavyweight French Terry Hoodie",
    slug: "premium-heavyweight-hoodie-380gsm",
    category: "Apparel",
    mrp: 1899,
    basePrice: 1150,
    bulkPrice50: 880,
    bulkPrice250: 790,
    image: "/templates/hoodie-heavy.svg",
  },
};

export type CorporateAudience = "new_joiners" | "client_vip" | "festive" | "conference";

export interface KitRecommendation {
  kitTitle: string;
  themeTagline: string;
  items: KitProduct[];
  mrpPerKit: number;
  bulkPricePerKit: number;
  savingsPerKit: number;
  percentSavings: number;
  totalTeamInvestment: number;
  totalProjectSavings: number;
  estimatedTurnaround: string;
}

export function recommendCorporateKit(
  teamSize: number,
  budgetPerPerson: number,
  audience: CorporateAudience
): KitRecommendation {
  const isLargeRun = teamSize >= 200;

  let selectedKeys: [string, string, string];
  let kitTitle: string;
  let themeTagline: string;

  if (audience === "new_joiners") {
    kitTitle = "Day-One Artisan Onboarding Hamper";
    themeTagline = "Equip new team members with premium identity and workspace essentials.";
    if (budgetPerPerson < 700) {
      selectedKeys = ["badge", "cap", "journal"];
    } else if (budgetPerPerson < 1200) {
      selectedKeys = ["tee", "flask", "badge"];
    } else {
      selectedKeys = ["polo", "flask", "journal"];
    }
  } else if (audience === "client_vip") {
    kitTitle = "Executive Prestige Corporate Suite";
    themeTagline = "Laser-engraved executive accessories that leave a permanent impression.";
    if (budgetPerPerson < 900) {
      selectedKeys = ["journal", "pen", "flask"];
    } else if (budgetPerPerson < 1600) {
      selectedKeys = ["polo", "flask", "pen"];
    } else {
      selectedKeys = ["hoodie", "flask", "journal"];
    }
  } else if (audience === "festive") {
    kitTitle = "Festive Celebration & Diwali Gift Box";
    themeTagline = "Premium seasonal appreciation gifts presented in artisan magnetic-clasp box.";
    if (budgetPerPerson < 800) {
      selectedKeys = ["cap", "flask", "badge"];
    } else if (budgetPerPerson < 1400) {
      selectedKeys = ["tee", "flask", "journal"];
    } else {
      selectedKeys = ["hoodie", "flask", "pen"];
    }
  } else {
    // Conference / Tech Summit
    kitTitle = "Developer Summit & Conference Swag Pack";
    themeTagline = "High-velocity tech conference gear that attendees wear for years.";
    if (budgetPerPerson < 600) {
      selectedKeys = ["badge", "cap", "pen"];
    } else if (budgetPerPerson < 1100) {
      selectedKeys = ["tee", "badge", "cap"];
    } else {
      selectedKeys = ["tee", "flask", "journal"];
    }
  }

  const items = selectedKeys.map((key) => CORPORATE_CATALOG[key] || CORPORATE_CATALOG.badge);

  const mrpPerKit = items.reduce((sum, item) => sum + item.mrp, 0);
  const bulkPricePerKit = items.reduce(
    (sum, item) => sum + (isLargeRun ? item.bulkPrice250 : item.bulkPrice50),
    0
  );

  const savingsPerKit = mrpPerKit - bulkPricePerKit;
  const percentSavings = Math.round((savingsPerKit / mrpPerKit) * 100);
  const totalTeamInvestment = bulkPricePerKit * teamSize;
  const totalProjectSavings = savingsPerKit * teamSize;

  return {
    kitTitle,
    themeTagline,
    items,
    mrpPerKit,
    bulkPricePerKit,
    savingsPerKit,
    percentSavings,
    totalTeamInvestment,
    totalProjectSavings,
    estimatedTurnaround: teamSize > 500 ? "5-6 working days" : "3-4 working days",
  };
}

