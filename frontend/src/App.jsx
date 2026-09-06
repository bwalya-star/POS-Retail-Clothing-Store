import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import POSTerminalPage from "./pages/POSTerminalPage";
import RestockPage from "./pages/RestockPage";

function RoleRouter() {
  const { auth, logout } = useAuth();

  if (!auth) return <LoginPage />;

  switch (auth.role) {
    case "cashier":
      return <POSTerminalPage />;
    case "manager":
      return <RestockPage />;
    case "admin":
      // Admin UI (Manage Employees, Manage Users, Reports) is out of scope
      // for this iteration - see docs/detailed_use_cases.md "Remaining Use Cases".
      return (
        <div className="page centered">
          <div className="card">
            <h1>Admin</h1>
            <p>Admin features (Manage Employees, Manage Users, Reports) are planned for a later iteration.</p>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      );
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
