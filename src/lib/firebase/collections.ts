/** Firestore collection paths — keep single source of truth. */
export const COLLECTIONS = {
  users: "users",
  vendors: "vendors",
  catalog: "catalog",
  orders: "orders",
  notifications: "notifications",
  analytics: "analyticsEvents",
  slugIndex: "slugIndex", // maps slug → vendorId for uniqueness
} as const;

export function vendorCatalogPath(vendorId: string) {
  return `${COLLECTIONS.vendors}/${vendorId}/${COLLECTIONS.catalog}`;
}

export function vendorOrdersPath(vendorId: string) {
  return `${COLLECTIONS.vendors}/${vendorId}/${COLLECTIONS.orders}`;
}

export function userNotificationsPath(userId: string) {
  return `${COLLECTIONS.users}/${userId}/${COLLECTIONS.notifications}`;
}
