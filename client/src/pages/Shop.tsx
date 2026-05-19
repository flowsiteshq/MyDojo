import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Filter } from "lucide-react";
import { ShopCheckoutModal, type ShopProduct } from "@/components/ShopCheckoutModal";

type Product = ShopProduct & {
  subtitle: string;
  badge?: string;
  description: string;
  features: string[];
};

const products: Product[] = [
  {
    id: "kihon-gi",
    name: "Kihon Gi",
    subtitle: "The Foundation of Every Martial Artist",
    price: 49.0,
    category: "Uniforms & Gis",
    badge: "Beginner",
    image: "/manus-storage/kihon-gi_a810db18.webp",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
    description:
      "Begin your martial arts journey with the Kihon Gi, designed specifically for new students stepping onto the mat for the first time. Crafted from breathable cotton with reinforced seams for maximum comfort and freedom of movement.",
    features: [
      "Crisp white — symbolizing a fresh start",
      "Light & medium weight cotton/poly blend",
      "Reinforced stitching for durability",
      "Includes white belt",
      "Silk-screened MyDojo logo",
    ],
  },
  {
    id: "mydojo-classic-tshirt",
    name: "MyDojo Classic T-Shirt",
    subtitle: "Wear the Way You Train",
    price: 29.0,
    category: "Apparel",
    badge: "T-Shirts",
    image: "/manus-storage/mydojo-classic-tshirt_1e2fa7c6.webp",
    sizes: ["Youth S", "Youth M", "Youth L", "S", "M", "L", "XL"],
    description:
      "The MyDojo T-Shirt is where martial arts mindset meets everyday comfort. Whether you're training, coaching, or repping the dojo outside the gym, this tee delivers a clean, confident look built for movement and lifestyle.",
    features: [
      "Ultra-soft cotton/poly blend",
      "Athletic fit for unrestricted movement",
      "Ribbed crewneck & double-stitched seams",
      "Bold MyDojo logo on chest",
      "Available in Black, White, Gray, and Red",
      "Unisex sizing: Youth to Adult XL",
    ],
  },
  {
    id: "kickboxing-gloves",
    name: "Kickboxing Gloves",
    subtitle: "Train with Power. Strike with Precision.",
    price: 69.0,
    category: "Fight Gear",
    badge: "Kickboxing",
    image: "/manus-storage/kickboxing-gloves_2b12e422.webp",
    description:
      "Designed for all-around performance, the MyDojo 12 oz Kickboxing Gloves offer the perfect balance of speed, protection, and power. Crafted from durable synthetic leather with multi-layer padding.",
    features: [
      "12 oz — ideal for training, sparring & pad work",
      "Durable synthetic leather",
      "Multi-layer foam padding",
      "Adjustable hook-and-loop wrist wrap",
      "Moisture-wicking inner lining",
      "Available in Black, Red, and White",
    ],
  },
  {
    id: "kiacho-gi-middle",
    name: "Kiacho Gi – Middle Weight",
    subtitle: "The Mark of a Leader",
    price: 68.5,
    category: "Uniforms & Gis",
    badge: "Leadership Team",
    image: "/manus-storage/kiacho-gi-middle_90009422.webp",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
    description:
      "Reserved for members of the MyDojo Leadership Program, the Kaicho Gi stands out in bold red — a symbol of passion, courage, and commitment to service. Light and medium weight options for flexibility and endurance.",
    features: [
      "Striking red colorway — leadership & dedication",
      "Light and medium weight options",
      "Reinforced stitching & tailored cut",
      "Includes rank-appropriate belt",
      "Silk-screened MyDojo branding",
      "Exclusively for Leadership Program members",
    ],
  },
  {
    id: "kiacho-gi-heavy",
    name: "Kiacho Gi – Heavy Weight",
    subtitle: "Lead with Strength. Inspire with Purpose.",
    price: 99.0,
    category: "Uniforms & Gis",
    badge: "Leadership Team",
    image: "/manus-storage/kiacho-gi-heavy_8429a824.webp",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
    description:
      "The Kaicho Gi Heavyweight Edition is built for those who don't just wear the title of leader — they live it. Made from durable 14 oz heavyweight cotton with premium embroidery.",
    features: [
      "14 oz heavyweight cotton fabric",
      "Reinforced lapels, cuffs, and seams",
      "Embroidered MyDojo logo",
      "Athletic fit for leaders in motion",
      "Includes rank-appropriate belt",
      "Available only to Kaicho-level members",
    ],
  },
  {
    id: "shinobi-gi-middle",
    name: "Shinobi Gi – Middle Weight",
    subtitle: "For the Disciplined, the Driven, the Determined",
    price: 68.5,
    category: "Uniforms & Gis",
    badge: "Black Belt Program",
    image: "/manus-storage/shinobi-gi-middle_ca215873.webp",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
    description:
      "Reserved exclusively for students enrolled in the MyDojo Black Belt Program. Built for performance and prestige, the Shinobi Gi is constructed from premium medium-weight fabric that balances durability with mobility.",
    features: [
      "Premium black fabric — bold, authoritative look",
      "Tailored cut for clean silhouette & mobility",
      "Reinforced stitching for high-intensity training",
      "Medium-weight cotton blend",
      "Silk-screened MyDojo insignia",
      "Exclusive to Black Belt Program members",
    ],
  },
  {
    id: "shinobi-gi-heavy",
    name: "Shinobi Gi – Heavy Weight",
    subtitle: "Engineered for Mastery. Forged for the Black Belt.",
    price: 99.0,
    category: "Uniforms & Gis",
    badge: "Black Belt Program",
    image: "/manus-storage/shinobi-gi-heavy_9e348094.webp",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
    description:
      "Crafted for warriors in pursuit of excellence, the Shinobi Gi Heavyweight Edition is the ultimate expression of strength, skill, and commitment. Designed exclusively for MyDojo Black Belt Program members.",
    features: [
      "Heavyweight 14 oz cotton fabric",
      "Matte black finish — bold, elite aesthetic",
      "Tailored athletic cut",
      "Reinforced collar, sleeves, and pant seams",
      "Embroidered MyDojo insignia",
      "Optional belt-rank embroidery",
    ],
  },
  {
    id: "tetsujin-gi",
    name: "Tetsujin Gi",
    subtitle: "The Iron-Willed Tradition",
    price: 225.0,
    category: "Uniforms & Gis",
    badge: "Premium",
    image: "/manus-storage/tetsujin-gi_f79ace47.webp",
    sizes: ["0000", "000", "00", "0", "1", "2", "3", "4", "5", "6", "7"],
    description:
      "The Tetsujin Gi is more than just a uniform — it's a symbol of legacy, resilience, and mastery. Crafted for the true traditionalist and kata competitor, this heavyweight gi embodies the pure spirit of martial arts.",
    features: [
      "Vertical Japanese kanji — meticulously embroidered",
      "Signature MyDojo emblem on back",
      "Heavyweight construction",
      "Clean, minimalist traditional design",
      "Every stitch embroidered with intention",
    ],
  },
];

const categories = ["All", "Uniforms & Gis", "Apparel", "Fight Gear"];

const badgeColors: Record<string, string> = {
  Beginner: "bg-green-100 text-green-800",
  "T-Shirts": "bg-blue-100 text-blue-800",
  Kickboxing: "bg-orange-100 text-orange-800",
  "Leadership Team": "bg-red-100 text-red-800",
  "Black Belt Program": "bg-gray-900 text-white",
  Premium: "bg-yellow-100 text-yellow-800",
};

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<ShopProduct | null>(null);

  const filtered =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const openCheckout = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProduct(null);
    setCheckoutProduct({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      sizes: product.sizes,
      category: product.category,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="bg-black text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-main.jpg')] bg-cover bg-center opacity-20" />
        <div className="container relative z-10 text-center">
          <p className="text-primary font-bold tracking-widest uppercase text-sm mb-3">
            Official MyDojo Gear
          </p>
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-4">
            SHOP MYDOJO
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Premium uniforms, apparel, and fight gear — crafted for every level
            of your martial arts journey.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container py-4 flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-gray-500 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-500">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Image */}
                <div className="relative bg-gray-50 h-64 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.badge && (
                    <span
                      className={`absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-full ${badgeColors[product.badge] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-heading font-bold text-lg leading-tight mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3 italic">
                    {product.subtitle}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-black">
                      ${product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      className="bg-black hover:bg-primary text-white"
                      onClick={(e) => openCheckout(product, e)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Image */}
              <div className="bg-gray-50 flex items-center justify-center p-8 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none min-h-72">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="max-h-80 object-contain"
                />
              </div>

              {/* Details */}
              <div className="p-6 flex flex-col">
                {selectedProduct.badge && (
                  <span
                    className={`self-start text-xs font-bold px-2 py-1 rounded-full mb-3 ${badgeColors[selectedProduct.badge] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {selectedProduct.badge}
                  </span>
                )}
                <h2 className="text-2xl font-heading font-bold mb-1">
                  {selectedProduct.name}
                </h2>
                <p className="text-sm text-gray-500 italic mb-3">
                  {selectedProduct.subtitle}
                </p>
                <p className="text-3xl font-bold text-black mb-4">
                  ${selectedProduct.price.toFixed(2)}
                </p>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {selectedProduct.description}
                </p>

                <div className="mb-6">
                  <p className="font-semibold text-sm mb-2">Features:</p>
                  <ul className="space-y-1">
                    {selectedProduct.features.map((f, i) => (
                      <li key={i} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-primary font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <Button
                    className="bg-black hover:bg-primary text-white w-full"
                    onClick={() => openCheckout(selectedProduct)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy Now — ${selectedProduct.price.toFixed(2)}
                  </Button>
                  <button
                    className="text-sm text-gray-400 hover:text-gray-600 underline"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FluidPay Checkout Modal */}
      <ShopCheckoutModal
        product={checkoutProduct}
        open={!!checkoutProduct}
        onClose={() => setCheckoutProduct(null)}
      />
    </div>
  );
}
