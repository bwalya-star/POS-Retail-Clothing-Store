import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Loader from "../components/Loader";

const COLORS = [
  "#1E3A5F",
  "#5B2C6F",
  "#7B241C",
  "#1B5E4F",
  "#7C4A03",
  "#4A235A",
];

function getColor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

export default function DashboardPage({ navigate }) {
  const { auth } = useAuth();
  const [period, setPeriod] = useState("month");
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    saleCount: 0,
    averageSaleValue: 0,
  });
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [highlightProducts, setHighlightProducts] = useState(false);
  const productsSectionRef = useRef(null);

  function jumpToTopSellers() {
    productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightProducts(true);
    setTimeout(() => setHighlightProducts(false), 1200);
  }

  function handleStatCardKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      jumpToTopSellers();
    }
  }

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const [summaryData, sellersData] = await Promise.all([
        api.getSalesSummary(auth.token, period),
        api.getTopSellers(auth.token, period, 5),
      ]);

      setSummary(summaryData);
      setTopSellers(sellersData);
    } catch (err) {
      setError(err.message || "Failed to load sales dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const maxQuantity = topSellers.length
    ? Math.max(...topSellers.map((p) => Number(p.quantitySold)))
    : 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="section-heading" style={{ margin: 0 }}>Sales Dashboard</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <span className="alert-dot" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <Loader />
          <span>Loading dashboard…</span>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div
              className="stat-card is-clickable"
              role="button"
              tabIndex={0}
              title="Jump to top selling products"
              onClick={jumpToTopSellers}
              onKeyDown={handleStatCardKeyDown}
            >
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">
                K{Number(summary.totalRevenue).toFixed(2)}
              </span>
            </div>
            <div
              className="stat-card is-clickable"
              role="button"
              tabIndex={0}
              title="Jump to top selling products"
              onClick={jumpToTopSellers}
              onKeyDown={handleStatCardKeyDown}
            >
              <span className="stat-label">Number of Sales</span>
              <span className="stat-value">{summary.saleCount}</span>
            </div>
            <div
              className="stat-card is-clickable"
              role="button"
              tabIndex={0}
              title="Jump to top selling products"
              onClick={jumpToTopSellers}
              onKeyDown={handleStatCardKeyDown}
            >
              <span className="stat-label">Average Sale</span>
              <span className="stat-value">
                K{Number(summary.averageSaleValue).toFixed(2)}
              </span>
            </div>
          </div>

          <div
            className={`products-section${highlightProducts ? " is-highlighted" : ""}`}
            ref={productsSectionRef}
          >
            <h2 className="section-heading">Top Selling Products</h2>

            {topSellers.length === 0 ? (
              <div className="empty-state">
                <p>No sales for the selected period.</p>
              </div>
            ) : (
              <ul className="products-list">
                {topSellers.map((product) => {
                  const quantity = Number(product.quantitySold);
                  const barWidth = maxQuantity > 0 ? (quantity / maxQuantity) * 100 : 0;
                  const color = getColor(product.sku);

                  function openInInventory() {
                    navigate?.("inventory", { focusSku: product.sku });
                  }

                  return (
                    <li
                      key={product.productVariantId}
                      className="product-item is-clickable"
                      role="button"
                      tabIndex={0}
                      title={`View ${product.productName} in Inventory`}
                      onClick={openInInventory}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openInInventory();
                        }
                      }}
                    >
                      <div className="product-info">
                        <div className="product-details">
                          <div className="product-name">{product.productName}</div>
                          <div className="product-sku">{product.sku}</div>
                        </div>
                      </div>

                      <div className="product-stats">
                        <div className="product-metrics">
                          <span className="metric">
                            <span className="metric-label">Sold:</span>
                            <span className="metric-value">{quantity} units</span>
                          </span>
                          <span className="metric">
                            <span className="metric-label">Revenue:</span>
                            <span className="metric-value">
                              K{Number(product.revenue).toFixed(2)}
                            </span>
                          </span>
                        </div>

                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${barWidth}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
