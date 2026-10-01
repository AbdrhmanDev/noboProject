import {
  Beef,
  CakeSlice,
  Candy,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Drumstick,
  Fish,
  IceCreamBowl,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
} from "lucide-react";

// Picks a recognizable icon for a category purely from its own real name (Arabic or English
// keyword match) -- never an invented category or a fabricated per-category field the backend
// doesn't have. Order matters: more specific keywords ("ice cream") are checked before broader ones
// ("dessert") so e.g. "Ice Cream" doesn't fall through to the generic dessert icon.
const RULES = [
  { icon: Pizza, keywords: ["pizza", "بيتزا"] },
  { icon: Drumstick, keywords: ["chicken", "دجاج", "فراخ"] },
  { icon: Beef, keywords: ["burger", "برجر", "meat", "لحم", "steak", "ستيك", "grill", "مشاوي"] },
  { icon: Fish, keywords: ["fish", "سمك", "seafood", "بحري"] },
  { icon: Sandwich, keywords: ["sandwich", "ساندوتش", "سندوتش", "wrap"] },
  { icon: Soup, keywords: ["soup", "شوربة"] },
  { icon: Salad, keywords: ["salad", "سلطة", "sides", "مقبلات", "جانبية"] },
  { icon: CupSoda, keywords: ["drink", "مشروب", "beverage", "عصير", "juice", "soda"] },
  { icon: Coffee, keywords: ["coffee", "قهوة", "hot drinks", "مشروبات ساخنة", "tea", "شاي"] },
  { icon: IceCreamBowl, keywords: ["ice cream", "آيس كريم", "ايس كريم", "gelato"] },
  { icon: Candy, keywords: ["candy", "حلوى", "سكاكر"] },
  { icon: Cookie, keywords: ["cookie", "بسكويت", "snack", "سناك"] },
  { icon: CakeSlice, keywords: ["dessert", "حلويات", "حلو", "cake", "كيك"] },
  { icon: Croissant, keywords: ["bakery", "مخبوزات", "breakfast", "فطار", "فطور", "bread", "خبز"] },
];

export function getCategoryIcon(label) {
  const normalized = String(label || "").toLowerCase();
  const match = RULES.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword)));
  return match?.icon ?? UtensilsCrossed;
}
