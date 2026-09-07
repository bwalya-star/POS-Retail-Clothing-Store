import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/LoginPage";
import POSTerminalPage from "./pages/POSTerminalPage";
import InventoryPage from "./pages/InventoryPage";
import EmployeesPage from "./pages/EmployeesPage";
import DashboardPage from "./pages/DashboardPage";
import SalesPage from "./pages/SalesPage";

const NAV_BY_ROLE = {
  cashier: [
    { key: "pos", label: "POS" },
    { key: "sales", label: "Sales" },
  ],
  manager: [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "inventory", label: "Inventory" },
    { key: "sales", label: "Sales" },
    { key: "employees", label: "Employees" },
  ],
  superadmin: [
    { key: "dashboard", label: "Dashboard" },
    { key: "pos", label: "POS" },
    { key: "inventory", label: "Inventory" },
    { key: "sales", label: "Sales" },
    { key: "employees", label: "Employees" },
  ],
};

const PAGES = {
  dashboard: DashboardPage,
  pos: POSTerminalPage,
  inventory: InventoryPage,
  sales: SalesPage,
  employees: EmployeesPage,
};

function MainApp() {
  const { auth } = useAuth();
  const navItems = NAV_BY_ROLE[auth.role] || [];

  const [activeKey, setActiveKey] = useState(
    navItems[0]?.key
  );
  const [navParams, setNavParams] = useState(null);

  const Page = PAGES[activeKey];

  function navigate(key, params = null) {
    setActiveKey(key);
    setNavParams(params);
  }

  function selectNav(key) {
    setActiveKey(key);
    setNavParams(null);
  }

  return (
    <AppShell navItems={navItems} activeKey={activeKey} onSelect={selectNav}>
      {Page ? <Page navigate={navigate} navParams={navParams} /> : null}
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
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  );
}
