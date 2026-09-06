import { z } from "zod";
import { STORE_ORDER_STATUSES, STORE_FULFILLMENT_METHODS, STORE_COUPON_DISCOUNT_TYPES } from "../enums";

// ---------------------------------------------------------------------------
// CATEGORIES
// ---------------------------------------------------------------------------

export const createStoreCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
});
export type CreateStoreCategoryDto = z.infer<typeof createStoreCategorySchema>;

export const updateStoreCategorySchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});
export type UpdateStoreCategoryDto = z.infer<typeof updateStoreCategorySchema>;

// ---------------------------------------------------------------------------
// PRODUCTS
// ---------------------------------------------------------------------------

const variantInputSchema = z.object({
  label: z.string().min(1),
  attributes: z.record(z.string()).optional(),
  sku: z.string().optional(),
  priceOverride: z.number().positive().optional(),
  salePriceOverride: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).optional(),
});
export type StoreVariantInput = z.infer<typeof variantInputSchema>;

export const createStoreProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive(),
  salePrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  required: z.boolean().optional(),
  academicYearId: z.string().optional(),
  classIds: z.array(z.string()).optional(), // empty/omitted = visible to all classes
  // If variants provided, hasVariants = true and product-level stock is ignored.
  variants: z.array(variantInputSchema).optional(),
  stockQuantity: z.number().int().min(0).optional(), // used only when no variants
  lowStockThreshold: z.number().int().min(0).optional(),
});
export type CreateStoreProductDto = z.infer<typeof createStoreProductSchema>;

export const updateStoreProductSchema = z.object({
  categoryId: z.string().optional(),
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  salePrice: z.number().positive().nullable().optional(),
  imageUrl: z.string().url().optional(),
  required: z.boolean().optional(),
  academicYearId: z.string().nullable().optional(),
  classIds: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});
export type UpdateStoreProductDto = z.infer<typeof updateStoreProductSchema>;

export const addProductImageSchema = z.object({
  imageUrl: z.string().url(),
  displayOrder: z.number().int().min(0).optional(),
});
export type AddProductImageDto = z.infer<typeof addProductImageSchema>;

export const createVariantSchema = variantInputSchema;
export const updateVariantSchema = z.object({
  label: z.string().min(1).optional(),
  attributes: z.record(z.string()).optional(),
  sku: z.string().optional(),
  priceOverride: z.number().positive().nullable().optional(),
  salePriceOverride: z.number().positive().nullable().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});
export type UpdateVariantDto = z.infer<typeof updateVariantSchema>;

export const listStoreProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  classId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
});
export type ListStoreProductsQuery = z.infer<typeof listStoreProductsQuerySchema>;

// ---------------------------------------------------------------------------
// INVENTORY
// ---------------------------------------------------------------------------

export const adjustStockSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  // Positive = add stock (restock), negative = remove (damage/loss/correction).
  quantityChange: z.number().int().refine((v) => v !== 0, "quantityChange cannot be 0"),
  note: z.string().optional(),
});
export type AdjustStockDto = z.infer<typeof adjustStockSchema>;

// ---------------------------------------------------------------------------
// CART
// ---------------------------------------------------------------------------

export const addToCartSchema = z.object({
  studentId: z.string().min(1), // who the purchase is for (self for a Student, chosen child for a Parent)
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});
export type AddToCartDto = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;

export const addBundleToCartSchema = z.object({
  studentId: z.string().min(1),
  bundleId: z.string().min(1),
});
export type AddBundleToCartDto = z.infer<typeof addBundleToCartSchema>;

// ---------------------------------------------------------------------------
// CHECKOUT / ORDERS
// ---------------------------------------------------------------------------

export const checkoutSchema = z.object({
  studentId: z.string().min(1),
  fulfillmentMethod: z.enum(STORE_FULFILLMENT_METHODS).default("PICKUP"),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});
export type CheckoutDto = z.infer<typeof checkoutSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(STORE_ORDER_STATUSES),
});
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

export const listStoreOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(STORE_ORDER_STATUSES).optional(),
  studentId: z.string().optional(),
});
export type ListStoreOrdersQuery = z.infer<typeof listStoreOrdersQuerySchema>;

// ---------------------------------------------------------------------------
// COUPONS
// ---------------------------------------------------------------------------

export const createCouponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discountType: z.enum(STORE_COUPON_DISCOUNT_TYPES),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});
export type CreateCouponDto = z.infer<typeof createCouponSchema>;

export const updateCouponSchema = z.object({
  description: z.string().optional(),
  discountValue: z.number().positive().optional(),
  minOrderAmount: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  active: z.boolean().optional(),
});
export type UpdateCouponDto = z.infer<typeof updateCouponSchema>;

// ---------------------------------------------------------------------------
// BUNDLES ("Complete Sets")
// ---------------------------------------------------------------------------

export const createBundleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  classId: z.string().optional(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).default(1) })).min(1),
});
export type CreateBundleDto = z.infer<typeof createBundleSchema>;

export const updateBundleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  classId: z.string().nullable().optional(),
  active: z.boolean().optional(),
});
export type UpdateBundleDto = z.infer<typeof updateBundleSchema>;

// ---------------------------------------------------------------------------
// STORE SETTINGS (stored in the existing generic `settings` key/value table)
// ---------------------------------------------------------------------------

export const STORE_SETTINGS_KEYS = [
  "store_pickup_available",
  "store_delivery_available",
  "store_pickup_instructions",
  "store_contact_phone",
  "store_contact_email",
  "store_collection_hours",
  "store_delivery_fee",
] as const;

export const updateStoreSettingsSchema = z.object({
  pickupAvailable: z.boolean().optional(),
  deliveryAvailable: z.boolean().optional(),
  pickupInstructions: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  collectionHours: z.string().optional(),
  deliveryFee: z.number().min(0).optional(),
});
export type UpdateStoreSettingsDto = z.infer<typeof updateStoreSettingsSchema>;
