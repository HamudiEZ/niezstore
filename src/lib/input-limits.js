export const INPUT_LIMITS = {
  search: 120,
  slug: 120,

  categoryName: 50,
  categoryDescription: 300,

  productName: 140,
  productDescription: 3000,
  productBrand: 50,

  optionName: 60,
  optionValue: 60,
  optionValuesCsv: 600,
  optionPositionMax: 999,

  sku: 80,
  imageUrl: 2048,
  notes: 1000,

  stockMax: 1000000,
  priceMax: 100000000,

  checkoutPhone: 22,
  checkoutPostalCode: 10,

  userEmail: 120,
  userFullName: 60,

  addressLabel: 40,
  addressReceiver: 60,

  checkoutFullName: 60,
  checkoutLine1: 180,
  checkoutCity: 60,
  checkoutCountry: 2,
  checkoutRegion: 80,
  checkoutLine2: 180,
  maxAddressesPerUser: 5,

  receiptMaxBytes: 5 * 1024 * 1024,          // 5 MB
  receiptCloudinaryFolder: "niezstore/receipts",
  receiptAllowedFormats: "jpg,jpeg,png,pdf",
};

export function normalizeSearchTerm(value) {
  return String(value ?? "").trim().slice(0, INPUT_LIMITS.search);
}
