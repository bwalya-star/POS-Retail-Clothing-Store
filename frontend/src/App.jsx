import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import POSTerminalPage from "./pages/POSTerminalPage";
import RestockPage from "./pages/RestockPage";
import SuperAdminPage from "./pages/SuperAdminPage";

function RoleRouter() {
  const { auth } = useAuth();

  if (!auth) return <LoginPage />;

  switch (auth.role) {
    case "cashier":
      return <POSTerminalPage />;
    case "manager":
      return <RestockPage />;
    case "superadmin":
      return <SuperAdminPage />;
    default:
      return <LoginPage />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RoleRouter />
    </AuthProvider>
  );
}
