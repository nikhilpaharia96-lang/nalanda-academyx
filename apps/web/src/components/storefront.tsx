"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { payFee } from "@/lib/razorpay";
import { formatCurrency, formatDate, statusBadgeClass, humanize } from "@/lib/fees";
import { ShoppingCart, Package, Plus, Minus, Trash2, Loader2, CheckCircle2, MapPin, Receipt } from "lucide-react";

interface CategoryRef {
  id: string;
  name: string;
  icon: string | null;
}

interface CatalogVariant {
  id: string;
  label: string;
  attributes: Record<string, string> | null;
  price: number;
  salePrice: number | null;
  available: number;
}

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  salePrice: number | null;
  required: boolean;
  category: CategoryRef | null;
  hasVariants: boolean;
  available: number | null;
  inStock: boolean;
  variants: CatalogVariant[];
}

interface CatalogResponse {
  studentClassId: string;
  required: CatalogProduct[];
  optional: CatalogProduct[];
}

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  variantId: string | null;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: number;
  exceedsAvailable: boolean;
}

interface CartResponse {
  cartId: string;
  items: CartItem[];
  subtotal: number;
}

interface StoreSettings {
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  pickupInstructions: string;
  collectionHours: string;
  deliveryFee: number;
}

interface OrderItem {
  id: string;
  productName: string;
  variantLabel: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface StoreOrder {
  id: string;
  studentId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  fulfillmentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

type Tab = "shop" | "cart" | "orders";

function ProductCard({ product, onAdd }: { product: CatalogProduct; onAdd: (productId: string, variantId: string | undefined, quantity: number) => Promise<void> }) {
  const [variantId, setVariantId] = useState<string>(product.variants[0]?.id ?? "");
  const [adding, setAdding] = useState(false);

  const activeVariant = product.variants.find((v) => v.id === variantId);
  const price = activeVariant ? activeVariant.salePrice ?? activeVariant.price : product.salePrice ?? product.price;
  const originalPrice = activeVariant ? activeVariant.price : product.price;
  const onSale = price < originalPrice;
  const inStock = product.hasVariants ? (activeVariant ? activeVariant.available > 0 : false) : product.inStock;

  async function handleAdd() {
    setAdding(true);
    try {
      await onAdd(product.id, product.hasVariants ? variantId : undefined, 1);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="flex h-32 items-center justify-center bg-neutral-50">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package className="h-10 w-10 text-neutral-300" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-display text-sm font-bold text-navy">{product.name}</h3>
          {product.required && <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">Required</span>}
        </div>
        {product.category && <p className="mb-2 text-xs text-neutral-400">{product.category.name}</p>}
        {product.description && <p className="mb-3 line-clamp-2 text-xs text-neutral-500">{product.description}</p>}

        {product.hasVariants && product.variants.length > 0 && (
          <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="mb-3 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-academic">
            {product.variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.available <= 0}>
                {v.label} {v.available <= 0 ? "(Out of stock)" : ""}
              </option>
            ))}
          </select>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <span className="font-display text-sm font-bold text-navy">{formatCurrency(price)}</span>
            {onSale && <span className="ml-1.5 text-xs text-neutral-400 line-through">{formatCurrency(originalPrice)}</span>}
          </div>
          <button
            onClick={handleAdd}
            disabled={!inStock || adding || (product.hasVariants && !variantId)}
            className="flex items-center gap-1 rounded-md bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            {inStock ? "Add" : "Out of stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Storefront({ studentId, studentName }: { studentId: string; studentName: string }) {
  const [tab, setTab] = useState<Tab>("shop");
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [orders, setOrders] = useState<StoreOrder[] | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [contactPhone, setContactPhone] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const loadCatalog = useCallback(() => {
    api.get<CatalogResponse>(`/store/catalog/${studentId}`).then(setCatalog).catch(() => {});
  }, [studentId]);
  const loadCart = useCallback(() => {
    api.get<CartResponse>(`/store/cart/${studentId}`).then(setCart).catch(() => {});
  }, [studentId]);
  const loadOrders = useCallback(() => {
    api
      .get<StoreOrder[]>("/store/orders/mine")
      .then((all) => setOrders(all.filter((o) => o.studentId === studentId)))
      .catch(() => {});
  }, [studentId]);

  useEffect(() => {
    loadCatalog();
    loadCart();
    loadOrders();
    api.get<StoreSettings>("/store/settings").then(setSettings).catch(() => {});
  }, [loadCatalog, loadCart, loadOrders]);

  async function handleAdd(productId: string, variantId: string | undefined, quantity: number) {
    try {
      const updated = await api.post<CartResponse>("/store/cart/items", { studentId, productId, variantId, quantity });
      setCart(updated);
      setMessage({ type: "success", text: "Added to cart." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof ApiError ? e.message : "Could not add item to cart" });
    }
  }

  async function updateQty(itemId: string, quantity: number) {
    if (quantity < 1) return;
    try {
      const updated = await api.patch<CartResponse>(`/store/cart/${studentId}/items/${itemId}`, { quantity });
      setCart(updated);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof ApiError ? e.message : "Could not update quantity" });
    }
  }

  async function removeItem(itemId: string) {
    try {
      const updated = await api.del<CartResponse>(`/store/cart/${studentId}/items/${itemId}`);
      setCart(updated);
    } catch (e) {
      setMessage({ type: "error", text: e instanceof ApiError ? e.message : "Could not remove item" });
    }
  }

  async function handleCheckout() {
    if (!cart || cart.items.length === 0) return;
    setCheckingOut(true);
    setMessage(null);
    try {
      const order = await api.post<StoreOrder>("/store/checkout", {
        studentId,
        fulfillmentMethod: fulfillment,
        contactPhone: contactPhone || undefined,
        contactAddress: fulfillment === "DELIVERY" ? contactAddress || undefined : undefined,
        couponCode: couponCode || undefined,
      });

      await payFee({
        storeOrderId: order.id,
        amount: order.totalAmount,
        studentName,
        description: `School Store order ${order.orderNumber}`,
        onSuccess: () => {
          setMessage({ type: "success", text: `Payment successful! Order ${order.orderNumber} is confirmed.` });
          loadCart();
          loadOrders();
          setTab("orders");
        },
        onError: (msg) => setMessage({ type: "error", text: msg }),
      });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof ApiError ? e.message : "Checkout failed" });
    } finally {
      setCheckingOut(false);
    }
  }

  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const deliveryFee = fulfillment === "DELIVERY" ? settings?.deliveryFee ?? 0 : 0;
  const estimatedTotal = (cart?.subtotal ?? 0) + deliveryFee;

  return (
    <div>
      {message && (
        <div className={`mb-4 rounded-md px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>
      )}

      <div className="mb-6 flex gap-2 border-b border-neutral-200">
        {(
          [
            ["shop", "Shop"],
            ["cart", `Cart${cartCount ? ` (${cartCount})` : ""}`],
            ["orders", "My Orders"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium ${tab === key ? "border-b-2 border-academic text-navy" : "text-neutral-500 hover:text-navy"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "shop" && (
        <div>
          {!catalog && <p className="text-sm text-neutral-500">Loading products…</p>}
          {catalog && catalog.required.length === 0 && catalog.optional.length === 0 && (
            <p className="text-sm text-neutral-500">No products are available for your class yet.</p>
          )}
          {catalog && catalog.required.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-navy">⭐ Required for your class</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {catalog.required.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={handleAdd} />
                ))}
              </div>
            </div>
          )}
          {catalog && catalog.optional.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-navy">Optional Items</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {catalog.optional.map((p) => (
                  <ProductCard key={p.id} product={p} onAdd={handleAdd} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "cart" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {(!cart || cart.items.length === 0) && (
              <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500">
                <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
                Your cart is empty.
              </div>
            )}
            <div className="space-y-3">
              {cart?.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-neutral-50">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-full w-full rounded object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy">{item.productName}</p>
                    {item.variantLabel && <p className="text-xs text-neutral-500">{item.variantLabel}</p>}
                    {item.exceedsAvailable && <p className="text-xs text-red-600">Only {item.available} left in stock</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="rounded border border-neutral-300 p-1 hover:bg-neutral-50">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="rounded border border-neutral-300 p-1 hover:bg-neutral-50">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-medium text-navy">{formatCurrency(item.lineTotal)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-5">
            <h3 className="mb-4 font-display text-sm font-bold text-navy">Order Summary</h3>

            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>{formatCurrency(cart?.subtotal ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Delivery/collection fee</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold text-navy">
                <span>Grand Total</span>
                <span>{formatCurrency(estimatedTotal)}</span>
              </div>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Collection method</label>
              <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value as "PICKUP" | "DELIVERY")} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic">
                {settings?.pickupAvailable !== false && <option value="PICKUP">School Collection</option>}
                {settings?.deliveryAvailable && <option value="DELIVERY">Home Delivery</option>}
              </select>
              {fulfillment === "PICKUP" && settings && (
                <p className="mt-1.5 flex items-start gap-1 text-xs text-neutral-500">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {settings.pickupInstructions} ({settings.collectionHours})
                </p>
              )}
            </div>

            {fulfillment === "DELIVERY" && (
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-neutral-600">Delivery address</label>
                <textarea value={contactAddress} onChange={(e) => setContactAddress(e.target.value)} rows={2} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
              </div>
            )}

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Contact phone</label>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-neutral-600">Coupon code</label>
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Optional" className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-academic" />
            </div>

            <button
              onClick={handleCheckout}
              disabled={!cart || cart.items.length === 0 || checkingOut}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-academic px-4 py-2.5 text-sm font-semibold text-navy hover:bg-academic/90 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Proceed to Payment
            </button>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          {(!orders || orders.length === 0) && <p className="text-sm text-neutral-500">No orders yet.</p>}
          {orders?.map((order) => (
            <div key={order.id} className="rounded-lg border border-neutral-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-bold text-navy">{order.orderNumber}</p>
                  <p className="text-xs text-neutral-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(order.paymentStatus)}`}>{humanize(order.paymentStatus)}</span>
                  <span className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy">{humanize(order.status)}</span>
                </div>
              </div>
              <div className="mb-3 space-y-1 text-sm text-neutral-600">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.productName} {item.variantLabel ? `(${item.variantLabel})` : ""} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <Receipt className="h-3 w-3" /> {order.fulfillmentMethod === "PICKUP" ? "School Collection" : "Home Delivery"}
                </span>
                <span className="font-display font-bold text-navy">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
