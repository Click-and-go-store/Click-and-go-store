import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Heart, ShoppingCart, X, Plus, Minus, Search, Trash2, CreditCard, Truck, ShieldCheck, BadgePercent, Star, ArrowRight, RefreshCw, AlertTriangle } from "lucide-react";

const ORANGE = "#F2701C";
const ORANGE_DEEP = "#D9560B";
const INK = "#1A1712";
const CREAM = "#F4F0E7";
const PAPER = "#FFFDF9";
const WHATSAPP_NUMBER = "573222518383"; // reemplaza por el número real de la tienda

// 👉 Link de tu Google Sheet vía opensheet.elk.sh (funciona en el navegador, sin bloqueos de Google).
// Formato: https://opensheet.elk.sh/ID_DE_TU_HOJA/1  (el "1" es la primera pestaña)
// Déjalo vacío ("") para usar el catálogo de ejemplo mientras configuras la hoja.
const SHEET_CSV_URL = "https://opensheet.elk.sh/1nRpOx1eBBGf1LzULChfgq_YjErvuXQOf4Sf76KU-CvQ/1";

const DISPLAY_FONT = "'Archivo Black', 'Arial Black', sans-serif";
const BODY_FONT = "'Inter', Arial, sans-serif";

// Catálogo de respaldo: se usa si SHEET_CSV_URL está vacío o la hoja no responde.
const FALLBACK_PRODUCTS = [
  { id: 1, name: "Parlante SABALA DR-300 200 WATTS", cat: "Tecnología", price: 999999, oldPrice: 1500000, rating: 4.8, img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", desc: "Cancelación de ruido activa, 30h de batería." },
  { id: 2, name: "Smartwatch Orbit X", cat: "Tecnología", price: 389000, rating: 4.6, img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", desc: "Monitor de salud 24/7 y GPS integrado." },
  { id: 3, name: "Teclado Mecánico Vortex", cat: "Tecnología", price: 219000, rating: 4.9, img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600", desc: "Switches táctiles, retroiluminación RGB." },
  { id: 4, name: "Cámara Instantánea Flick", cat: "Tecnología", price: 310000, oldPrice: 349000, rating: 4.5, img: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600", desc: "Impresión al instante, lente gran angular." },
  { id: 5, name: "Parlante Boom Mini", cat: "Tecnología", price: 159000, rating: 4.4, img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600", desc: "Sonido 360°, resistente al agua." },
  { id: 6, name: "Power Bank 20K", cat: "Tecnología", price: 99000, rating: 4.7, img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600", desc: "Carga rápida para tres dispositivos." },
  { id: 7, name: "Sérum Facial Glow", cat: "Belleza", price: 89000, rating: 4.8, img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600", desc: "Vitamina C + ácido hialurónico." },
  { id: 8, name: "Paleta de Sombras Terracota", cat: "Belleza", price: 76000, oldPrice: 95000, rating: 4.6, img: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600", desc: "12 tonos mate y shimmer de larga duración." },
  { id: 9, name: "Set Brochas Profesionales", cat: "Belleza", price: 68000, rating: 4.5, img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600", desc: "10 piezas, cerdas ultra suaves." },
  { id: 10, name: "Crema Hidratante Nocturna", cat: "Belleza", price: 92000, rating: 4.7, img: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600", desc: "Retinol suave, renueva mientras duermes." },
  { id: 11, name: "Perfume Ámbar 50ml", cat: "Belleza", price: 145000, rating: 4.9, img: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600", desc: "Notas cálidas de vainilla y sándalo." },
  { id: 12, name: "Plancha Alisadora Ionic", cat: "Belleza", price: 178000, oldPrice: 210000, rating: 4.6, img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600", desc: "Tecnología iónica, protege el cabello." },
];

const money = (n) => "$" + Number(n || 0).toLocaleString("es-CO");

// Convierte una fila del Google Sheet (encabezados: id,name,cat,price,oldPrice,rating,img,desc)
// en un objeto de producto, ignorando mayúsculas/espacios y filas vacías.
function normalizeRow(row) {
  const get = (key) => {
    const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === key);
    return foundKey ? row[foundKey] : undefined;
  };
  const name = (get("name") || "").toString().trim();
  if (!name) return null;
  const price = Number(String(get("price") || "0").replace(/[^0-9.-]/g, ""));
  const oldPriceRaw = get("oldprice");
  const oldPrice = oldPriceRaw ? Number(String(oldPriceRaw).replace(/[^0-9.-]/g, "")) : undefined;
  return {
    id: get("id") || name,
    name,
    cat: (get("cat") || "Tecnología").toString().trim(),
    price: isNaN(price) ? 0 : price,
    oldPrice: oldPrice && !isNaN(oldPrice) && oldPrice > price ? oldPrice : undefined,
    rating: Number(get("rating")) || 4.5,
    img: (get("img") || "").toString().trim(),
    desc: (get("desc") || "").toString().trim(),
  };
}

function CartLogo({ size = 34, color = ORANGE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M4 10h6.5c1.6 0 3 1.1 3.4 2.7L16 18h37.5c2 0 3.4 1.9 2.9 3.8l-4.7 17.4a4 4 0 0 1-3.9 3H21a4 4 0 0 1-3.9-3.1L11.5 15" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="23" cy="52" r="4.2" fill={color}/>
      <circle cx="45" cy="52" r="4.2" fill={color}/>
    </svg>
  );
}

function WhatsAppIcon({ size = 26, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill={color}>
      <path d="M16.02 3C9.4 3 4 8.38 4 15c0 2.36.68 4.56 1.86 6.42L4 29l7.77-1.82A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.62 28 15S22.64 3 16.02 3Zm6.94 16.98c-.3.85-1.53 1.56-2.48 1.75-.66.13-1.52.24-4.4-.94-3.69-1.53-6.06-5.28-6.24-5.53-.18-.25-1.5-2-1.5-3.8 0-1.8.94-2.68 1.28-3.05.34-.37.74-.46.98-.46.25 0 .5 0 .72.01.23.01.54-.09.84.64.3.74 1.03 2.55 1.12 2.73.09.18.15.4.03.65-.12.25-.18.4-.36.62-.18.21-.38.47-.54.63-.18.18-.37.38-.16.74.21.37.94 1.55 2.02 2.51 1.39 1.24 2.56 1.62 2.93 1.81.37.18.59.15.8-.09.22-.25.93-1.08 1.18-1.45.25-.37.5-.31.83-.19.34.12 2.14 1.01 2.51 1.2.37.18.61.28.7.43.09.16.09.9-.21 1.75Z"/>
    </svg>
  );
}

function StarRow({ value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <Star size={12} color={ORANGE} fill={ORANGE} />
      <span style={{ fontSize: 11, fontWeight: 700, color: "#6b6560" }}>{value}</span>
    </div>
  );
}

export default function App() {
  const [category, setCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [panel, setPanel] = useState(null);

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [sheetStatus, setSheetStatus] = useState(SHEET_CSV_URL ? "loading" : "demo"); // loading | live | error | demo
  const [lastSync, setLastSync] = useState(null);

  const loadFromSheet = useCallback(() => {
    if (!SHEET_CSV_URL) { setSheetStatus("demo"); return; }
    setSheetStatus("loading");
    fetch(SHEET_CSV_URL)
      .then(res => {
        if (!res.ok) throw new Error("No se pudo leer la hoja");
        return res.json();
      })
      .then(data => {
        const parsed = data.map(normalizeRow).filter(Boolean);
        if (parsed.length === 0) throw new Error("La hoja no tiene productos válidos");
        setProducts(parsed);
        setSheetStatus("live");
        setLastSync(new Date());
      })
      .catch(() => {
        setSheetStatus("error");
        setProducts(FALLBACK_PRODUCTS);
      });
  }, []);

  useEffect(() => { loadFromSheet(); }, [loadFromSheet]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.cat)));
    return ["Todos", ...unique];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p =>
      (category === "Todos" || p.cat === category) &&
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, category, query]);

  const addToCart = (product) => {
    setCart(prev => {
      const found = prev.find(i => i.id === product.id);
      if (found) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(prev => prev
      .map(i => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    );
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const toggleWishlist = (product) => {
    setWishlist(prev =>
      prev.find(i => i.id === product.id)
        ? prev.filter(i => i.id !== product.id)
        : [...prev, product]
    );
  };

  const isWished = (id) => wishlist.some(i => i.id === id);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("¡Hola Click & Go Store! Quiero más información sobre sus productos 🛒")}`;

  // Arma el mensaje de WhatsApp con el detalle del pedido para cerrar la compra por chat.
  const checkoutWhatsappHref = useMemo(() => {
    if (cart.length === 0) return whatsappHref;
    const lines = cart.map(i => `• ${i.qty}x ${i.name} — ${money(i.price * i.qty)}`).join("\n");
    const msg = `¡Hola Click & Go Store! Quiero confirmar este pedido:\n\n${lines}\n\nTotal: ${money(cartTotal)}\n\nMi nombre es: \nMi dirección es: `;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }, [cart, cartTotal, whatsappHref]);

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: BODY_FONT, color: INK }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Top utility bar */}
      <div style={{ background: INK, color: CREAM, fontFamily: BODY_FONT, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.3, textAlign: "center", padding: "7px 12px" }}>
        Envío gratis en compras superiores a {money(150000)} · Paga contraentrega o en línea
      </div>

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20, background: PAPER,
        borderBottom: `1px solid #e6e0d3`, padding: "14px 28px",
        display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
        boxShadow: "0 2px 10px rgba(26,23,18,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CartLogo />
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 19, fontFamily: DISPLAY_FONT, letterSpacing: 0.5 }}>
              CLICK &amp; GO
            </div>
            <div style={{ fontSize: 11, fontFamily: DISPLAY_FONT, color: ORANGE, letterSpacing: 4 }}>STORE</div>
          </div>
        </div>

        <div style={{
          flex: 1, minWidth: 200, display: "flex", alignItems: "center",
          background: CREAM, border: `1.5px solid #e6e0d3`, borderRadius: 999,
          padding: "9px 16px", gap: 8
        }}>
          <Search size={16} color="#8a8478" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar productos..."
            style={{ border: "none", outline: "none", flex: 1, fontFamily: BODY_FONT, fontSize: 14, background: "transparent", color: INK }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <IconButton onClick={() => setPanel("wishlist")} count={wishlist.length}>
            <Heart size={19} color={INK} />
          </IconButton>
          <IconButton onClick={() => setPanel("cart")} count={cartCount} accent>
            <ShoppingCart size={19} color="#fff" />
          </IconButton>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        position: "relative", overflow: "hidden",
        background: `linear-gradient(120deg, ${INK} 0%, #2a251d 55%, ${ORANGE_DEEP} 130%)`,
        color: CREAM, padding: "56px 28px 64px", display: "flex",
        alignItems: "center", gap: 40, flexWrap: "wrap"
      }}>
        <div style={{ flex: "1 1 380px", minWidth: 280 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(242,112,28,0.18)",
            border: `1px solid ${ORANGE}`, color: ORANGE, borderRadius: 999, padding: "5px 14px",
            fontSize: 12, fontWeight: 700, marginBottom: 18
          }}>
            <BadgePercent size={14} /> Nueva colección — hasta 25% OFF
          </div>
          <h1 style={{
            fontFamily: DISPLAY_FONT, fontSize: "clamp(32px, 4.2vw, 52px)", lineHeight: 1.05,
            margin: "0 0 16px", maxWidth: 520
          }}>
            TECNOLOGÍA Y BELLEZA,
            <br />
            <span style={{ color: ORANGE }}>UN CLIC DE DISTANCIA.</span>
          </h1>
          <p style={{ fontFamily: BODY_FONT, fontSize: 15.5, opacity: 0.85, maxWidth: 440, marginBottom: 26 }}>
            Encuentra gadgets de última generación y esenciales de belleza cuidadosamente seleccionados. Compra fácil, recibe rápido.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                background: ORANGE, color: "#fff", border: "none", borderRadius: 999,
                padding: "13px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, fontFamily: BODY_FONT
              }}
            >
              Ver catálogo <ArrowRight size={16} />
            </button>
            <a
              href={whatsappHref} target="_blank" rel="noopener noreferrer"
              style={{
                background: "transparent", color: CREAM, border: `1.5px solid rgba(244,240,231,0.5)`, borderRadius: 999,
                padding: "13px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none",
                display: "flex", alignItems: "center", gap: 8, fontFamily: BODY_FONT
              }}
            >
              <WhatsAppIcon size={17} color={CREAM} /> Escríbenos
            </a>
          </div>
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 240, display: "flex", justifyContent: "center" }}>
          <div style={{
            width: 230, height: 230, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(242,112,28,0.35), transparent 70%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <CartLogo size={140} color={CREAM} />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{
        display: "flex", justifyContent: "center", gap: "clamp(20px, 5vw, 56px)", flexWrap: "wrap",
        padding: "22px 24px", background: PAPER, borderBottom: "1px solid #e6e0d3"
      }}>
        <TrustItem icon={<Truck size={18} color={ORANGE} />} text="Envíos a todo el país" />
        <TrustItem icon={<ShieldCheck size={18} color={ORANGE} />} text="Pago 100% seguro" />
        <TrustItem icon={<CreditCard size={18} color={ORANGE} />} text="Contraentrega disponible" />
        <TrustItem icon={<Star size={18} color={ORANGE} />} text="+2.000 clientes felices" />
      </section>

      {/* Category tabs */}
      <div id="catalogo" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "34px 28px 14px", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: ORANGE, marginBottom: 4 }}>CATÁLOGO</div>
          <h2 style={{ fontFamily: DISPLAY_FONT, fontSize: 26, margin: "0 0 8px" }}>NUESTROS PRODUCTOS</h2>
          <SheetStatusBadge status={sheetStatus} lastSync={lastSync} onRefresh={loadFromSheet} />
        </div>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "9px 18px", borderRadius: 999, cursor: "pointer",
                fontWeight: 700, fontSize: 13, fontFamily: BODY_FONT,
                border: category === c ? `1.5px solid ${INK}` : "1.5px solid #e6e0d3",
                background: category === c ? INK : PAPER,
                color: category === c ? CREAM : INK,
                transition: "all .15s"
              }}
            >
              {c}
            </button>
          ))}
        </nav>
      </div>

      {/* Product grid */}
      <main style={{ padding: "10px 28px 70px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 22 }}>
        {filtered.map(p => (
          <div key={p.id} style={{
            background: PAPER, border: "1px solid #e6e0d3", borderRadius: 16,
            overflow: "hidden", display: "flex", flexDirection: "column",
            transition: "transform .18s, box-shadow .18s", position: "relative"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 14px 28px rgba(26,23,18,0.10)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ position: "relative", height: 170, overflow: "hidden", background: "#eee" }}>
              <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => toggleWishlist(p)}
                aria-label="Agregar a deseos"
                style={{
                  position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: "50%",
                  border: "none", background: "rgba(255,255,255,0.92)", display: "flex",
                  alignItems: "center", justifyContent: "center", cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                }}
              >
                <Heart size={16} color={ORANGE} fill={isWished(p.id) ? ORANGE : "none"} />
              </button>
              {p.oldPrice && (
                <span style={{
                  position: "absolute", top: 10, left: 10, background: ORANGE, color: "#fff",
                  fontSize: 10.5, fontWeight: 800, padding: "4px 9px", borderRadius: 999
                }}>-{Math.round((1 - p.price / p.oldPrice) * 100)}%</span>
              )}
              <span style={{
                position: "absolute", bottom: 10, left: 10, background: "rgba(26,23,18,0.85)", color: CREAM,
                fontSize: 10, fontWeight: 700, padding: "4px 9px", borderRadius: 999, letterSpacing: 1
              }}>{p.cat.toUpperCase()}</span>
            </div>
            <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              <StarRow value={p.rating} />
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</div>
              <div style={{ fontSize: 12.5, color: "#8a8478", flex: 1 }}>{p.desc}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <div>
                  {p.oldPrice && <div style={{ fontSize: 11.5, color: "#a39c8d", textDecoration: "line-through" }}>{money(p.oldPrice)}</div>}
                  <span style={{ fontWeight: 800, fontSize: 16.5 }}>{money(p.price)}</span>
                </div>
                <button
                  onClick={() => addToCart(p)}
                  style={{
                    background: INK, color: "#fff", border: "none", borderRadius: 999,
                    padding: "9px 15px", fontWeight: 700, fontSize: 12, fontFamily: BODY_FONT,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = ORANGE}
                  onMouseLeave={e => e.currentTarget.style.background = INK}
                >
                  <ShoppingCart size={14} /> Agregar
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 60, color: "#a39c8d" }}>
            No encontramos productos con ese nombre.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: INK, color: CREAM, padding: "36px 28px", fontFamily: BODY_FONT }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <CartLogo size={26} color={ORANGE} />
          <span style={{ fontFamily: DISPLAY_FONT, fontSize: 15 }}>CLICK &amp; GO STORE</span>
        </div>
        <p style={{ fontSize: 12.5, opacity: 0.65, maxWidth: 440, margin: 0 }}>
          Tu tienda de confianza para tecnología y belleza. Escríbenos por WhatsApp para asesoría personalizada y despacho el mismo día.
        </p>
        <div style={{ fontSize: 11.5, opacity: 0.45, marginTop: 18 }}>© {new Date().getFullYear()} Click & Go Store. Todos los derechos reservados.</div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 40,
          width: 58, height: 58, borderRadius: "50%", background: "#25D366",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 20px rgba(37,211,102,0.45)", textDecoration: "none",
          animation: "pulseWA 2.4s infinite"
        }}
        aria-label="Escríbenos por WhatsApp"
      >
        <WhatsAppIcon size={28} />
      </a>
      <style>{`
        @keyframes pulseWA {
          0% { box-shadow: 0 0 0 0 rgba(37,211,102,0.55); }
          70% { box-shadow: 0 0 0 14px rgba(37,211,102,0); }
          100% { box-shadow: 0 0 0 0 rgba(37,211,102,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          a[aria-label="Escríbenos por WhatsApp"] { animation: none; }
        }
      `}</style>

      {/* Side panel: cart or wishlist */}
      {panel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", justifyContent: "flex-end" }}>
          <div onClick={() => setPanel(null)} style={{ position: "absolute", inset: 0, background: "rgba(26,23,18,0.5)" }} />
          <div style={{
            position: "relative", width: "min(410px, 92vw)", height: "100%", background: CREAM,
            display: "flex", flexDirection: "column", fontFamily: BODY_FONT
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px", borderBottom: "1px solid #e6e0d3", background: PAPER }}>
              <div style={{ fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                {panel === "cart" ? <ShoppingCart size={18} color={ORANGE} /> : <Heart size={18} color={ORANGE} />}
                {panel === "cart" ? "Tu carrito" : "Tus deseos"}
              </div>
              <button onClick={() => setPanel(null)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={22} color={INK} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px" }}>
              {panel === "cart" && (
                cart.length === 0 ? (
                  <EmptyState text="Tu carrito está vacío. Agrega algún producto para comenzar." />
                ) : (
                  cart.map(item => (
                    <div key={item.id} style={{ display: "flex", gap: 10, padding: "14px 0", borderBottom: "1px solid #e6e0d3" }}>
                      <img src={item.img} alt={item.name} style={{ width: 62, height: 62, objectFit: "cover", borderRadius: 10, border: "1px solid #e6e0d3" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "#8a8478" }}>{money(item.price)}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                          <QtyBtn onClick={() => changeQty(item.id, -1)}><Minus size={12} /></QtyBtn>
                          <span style={{ fontWeight: 700, fontSize: 13, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                          <QtyBtn onClick={() => changeQty(item.id, 1)}><Plus size={12} /></QtyBtn>
                          <button onClick={() => removeFromCart(item.id)} style={{ marginLeft: "auto", border: "none", background: "transparent", cursor: "pointer" }}>
                            <Trash2 size={15} color="#b23b1e" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}

              {panel === "wishlist" && (
                wishlist.length === 0 ? (
                  <EmptyState text="Aún no has guardado productos deseados." />
                ) : (
                  wishlist.map(item => (
                    <div key={item.id} style={{ display: "flex", gap: 10, padding: "14px 0", borderBottom: "1px solid #e6e0d3" }}>
                      <img src={item.img} alt={item.name} style={{ width: 62, height: 62, objectFit: "cover", borderRadius: 10, border: "1px solid #e6e0d3" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: "#8a8478" }}>{money(item.price)}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <button onClick={() => addToCart(item)} style={{ background: ORANGE, color: "#fff", border: "none", borderRadius: 999, padding: "6px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Agregar al carrito</button>
                          <button onClick={() => toggleWishlist(item)} style={{ background: "transparent", border: "1px solid #cfc7b6", borderRadius: 999, padding: "6px 11px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Quitar</button>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {panel === "cart" && cart.length > 0 && (
              <div style={{ padding: "18px 22px", borderTop: "1px solid #e6e0d3", background: PAPER }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 15, marginBottom: 12 }}>
                  <span>Total</span>
                  <span>{money(cartTotal)}</span>
                </div>
                <a
                  href={checkoutWhatsappHref} target="_blank" rel="noopener noreferrer"
                  style={{
                    width: "100%", background: "#25D366", color: "#fff", border: "none", borderRadius: 999,
                    padding: "14px 0", fontWeight: 800, fontSize: 14, cursor: "pointer", textDecoration: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                  }}
                >
                  <WhatsAppIcon size={17} /> Finalizar pedido por WhatsApp
                </a>
                <div style={{ fontSize: 11, color: "#a39c8d", textAlign: "center", marginTop: 8 }}>
                  Te vamos a redirigir a WhatsApp con tu pedido ya escrito, listo para confirmar.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({ children, onClick, count, accent }) {
  return (
    <button onClick={onClick} style={{
      position: "relative", width: 42, height: 42, borderRadius: "50%",
      border: accent ? "none" : "1.5px solid #e6e0d3", background: accent ? ORANGE : PAPER,
      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
    }}>
      {children}
      {count > 0 && (
        <span style={{
          position: "absolute", top: -5, right: -5, background: accent ? INK : ORANGE, color: "#fff",
          fontSize: 10, fontWeight: 800, borderRadius: "50%", width: 18, height: 18,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>{count}</span>
      )}
    </button>
  );
}

function QtyBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 24, height: 24, borderRadius: "50%", border: "1px solid #cfc7b6",
      background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
    }}>{children}</button>
  );
}

function TrustItem({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "#4a463d" }}>
      {icon} {text}
    </div>
  );
}

function SheetStatusBadge({ status, lastSync, onRefresh }) {
  const map = {
    demo: { color: "#8a8478", label: "Catálogo de ejemplo (conecta tu Google Sheet)", icon: <AlertTriangle size={12} /> },
    loading: { color: "#8a8478", label: "Sincronizando con Google Sheets…", icon: <RefreshCw size={12} className="spin" /> },
    live: { color: "#3d8b5f", label: lastSync ? `Actualizado desde Sheets · ${lastSync.toLocaleTimeString("es-CO")}` : "Actualizado desde Sheets", icon: <RefreshCw size={12} /> },
    error: { color: "#b23b1e", label: "No se pudo leer la hoja, mostrando catálogo de ejemplo", icon: <AlertTriangle size={12} /> },
  };
  const s = map[status] || map.demo;
  return (
    <button
      onClick={onRefresh}
      title="Volver a sincronizar con Google Sheets"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, background: "transparent",
        border: "none", cursor: "pointer", color: s.color, fontSize: 11.5, fontWeight: 600, padding: 0
      }}
    >
      {s.icon} {s.label}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 10px", color: "#a39c8d" }}>
      <CartLogo size={40} />
      <div style={{ marginTop: 12, fontSize: 13 }}>{text}</div>
    </div>
  );
}

