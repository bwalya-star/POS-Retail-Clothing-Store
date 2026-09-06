import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import POSTerminalPage from "./pages/POSTerminalPage";
import InventoryPage from "./pages/InventoryPage";
import EmployeesPage from "./pages/EmployeesPage";
import DashboardPage from "./pages/DashboardPage";

const NAV_BY_ROLE = {
  cashier: [
    { key: "pos", label: "POS" },
  ],

  manager: [
    { key: "dashboard", label: "Dashboard" },
    { key: "inventory", label: "Inventory" },
  ],

  superadmin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "inventory", label: "Inventory" },
    { key: "employees", label: "Employees" },
  ],
};

const PAGES = {
  dashboard: DashboardPage,
  pos: POSTerminalPage,
  inventory: InventoryPage,
  employees: EmployeesPage,
};

function MainApp() {
  const { auth } = useAuth();
  const navItems = NAV_BY_ROLE[auth.role] || [];

  const Page = PAGES[activeKey];

  const [activeKey, setActiveKey] = useState(
    navItems[0]?.key
  );

  return (
    <AppShell
      navItems={navItems}
      activeKey={activeKey}
      onSelect={setActiveKey}
    >
      {Page ? <Page /> : null}
    </AppShell>
  );
}

function Root() {
  const { auth } = useAuth();

  if (!auth) {
    return <LoginPage />;
  }

  return <MainApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}