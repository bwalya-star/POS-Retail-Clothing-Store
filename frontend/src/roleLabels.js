export const ROLE_LABELS = {
  cashier: "Cashier",
  manager: "Store Manager",
  superadmin: "Super Admin",
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}
