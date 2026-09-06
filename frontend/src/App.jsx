import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import POSTerminalPage from "./pages/POSTerminalPage";
import InventoryPage from "./pages/InventoryPage";
import EmployeesPage from "./pages/EmployeesPage";

const NAV_BY_ROLE = {
  cashier: [{ key: "pos", label: "POS" }],
  manager: [{ key: "inventory", label: "Inventory" }],
  superadmin: [
    { key: "pos", label: "POS" },
    { key: "inventory", label: "Inventory" },
    { key: "employees", label: "Employees" },
  ],
};

const PAGES = {
  pos: POSTerminalPage,
  inventory: InventoryPage,
  employees: EmployeesPage,
};

function MainApp() {
  const { auth } = useAuth();
  const navItems = NAV_BY_ROLE[auth.role] || [];
  const [activeKey, setActiveKey] = useState(navItems[0]?.key);
  const Page = PAGES[activeKey];

  return (
    <AppShell navItems={navItems} activeKey={activeKey} onSelect={setActiveKey}>
      {Page ? <Page /> : null}
    </AppShell>
  );
}

function Root() {
  const { auth } = useAuth();
  if (!auth) return <LoginPage />;
  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
