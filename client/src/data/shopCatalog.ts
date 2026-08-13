import type { ShopProduct } from "@/components/ShopCheckoutModal";

export type ShopCatalogProduct = ShopProduct & {
  subtitle: string;
  badge?: string;
};

export const STUDENT_SHOP_PRODUCTS: ShopCatalogProduct[] = [
  {
    id: "kihon-gi",
    name: "Kihon Gi",
    subtitle: "The foundation of every martial artist",
    price: 49,
    category: "Uniforms & Gis",
    badge: "Beginner",
    image: "/manus-storage/kihon_gi_front_user_72651701.png",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
  },
  {
    id: "mydojo-classic-tshirt",
    name: "MyDojo Classic T-Shirt",
    subtitle: "Wear the way you train",
    price: 29,
    category: "Apparel",
    badge: "Apparel",
    image: "/manus-storage/tshirt_front_d16e6472.png",
    sizes: ["Youth S", "Youth M", "Youth L", "S", "M", "L", "XL"],
  },
  {
    id: "kickboxing-gloves",
    name: "Kickboxing Gloves",
    subtitle: "Train with power and precision",
    price: 69,
    category: "Fight Gear",
    badge: "Kickboxing",
    image: "/manus-storage/gloves_front_98a1c3db.png",
  },
  {
    id: "kiacho-gi-middle",
    name: "Kaicho Gi — Middle Weight",
    subtitle: "The mark of a leader",
    price: 68.5,
    category: "Uniforms & Gis",
    badge: "Leadership",
    image: "/manus-storage/kiacho_front_d8d3190b.png",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
  },
  {
    id: "shinobi-gi-middle",
    name: "Shinobi Gi — Middle Weight",
    subtitle: "Built for the Black Belt Program",
    price: 68.5,
    category: "Uniforms & Gis",
    badge: "Black Belt",
    image: "/manus-storage/shinobi_front_7f4a7c28.png",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
  },
  {
    id: "tetsujin-gi",
    name: "Tetsujin Gi",
    subtitle: "The iron-willed tradition",
    price: 225,
    category: "Uniforms & Gis",
    badge: "Premium",
    image: "/manus-storage/tetsujin_front_8d12442b.png",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
  },
];
