import { useState } from "react";
import { Check, Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatPrice } from "../lib/format";
import { useCart } from "../context/CartContext";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="group overflow-hidden rounded-[1.8rem] bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[1/1.02] overflow-hidden bg-yara-rose">
        <Link to={`/product/${product.id}`} aria-label={`View ${product.name}`}>
          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
        </Link>
        {product.badge && <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[0.58rem] uppercase tracking-[0.12em] text-yara-wine backdrop-blur">{product.badge}</span>}
        <button
          onClick={() => setSaved((value) => !value)}
          className="absolute right-4 top-4 rounded-full bg-white/90 p-2.5 backdrop-blur transition hover:scale-105"
          aria-label={saved ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-yara-wine text-yara-wine" : ""}`} />
        </button>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="rounded-full border border-yara-gold/70 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.1em] text-yara-taupe">{product.concern}</span>
          <span className="flex items-center gap-1 text-[0.63rem]"><Star className="h-3 w-3 fill-yara-gold text-yara-gold" /> {product.rating} ({product.reviews})</span>
        </div>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-xl leading-tight transition group-hover:text-yara-wine">{product.name}</h3>
          <p className="mt-1 text-xs font-light leading-5 text-yara-taupe">{product.subtitle}</p>
        </Link>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="font-serif text-lg font-semibold text-yara-wine">{formatPrice(product.price)}</span>
          <button onClick={handleAdd} className="grid h-10 w-10 place-items-center rounded-full bg-yara-wine text-white transition hover:scale-105" aria-label={`Add ${product.name} to cart`}>
            {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}
