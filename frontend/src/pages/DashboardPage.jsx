import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const COLORS = [
  "#4A6CF7",
  "#6B4CE6",
  "#E85C5C",
  "#38B2AC",
  "#ED8936",
  "#9F7AEA",
];

function getColor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

export default function DashboardPage() {
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
        <h1>Sales Dashboard</h1>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">
                ${Number(summary.totalRevenue).toFixed(2)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Number of Sales</span>
              <span className="stat-value">{summary.saleCount}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average Sale</span>
              <span className="stat-value">
                ${Number(summary.averageSaleValue).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="products-section">
            <h2>Top Selling Products</h2>

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

                  return (
                    <li key={product.productVariantId} className="product-item">
                      <div className="product-info">
                        <div
                          className="product-avatar"
                          style={{ backgroundColor: color }}
                        >
                          {product.productName.charAt(0)}
                        </div>
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
                              ${Number(product.revenue).toFixed(2)}
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

      <style jsx>{`
        .dashboard-container {
          flex: 1;
          min-width: 0;
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .dashboard-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .dashboard-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: #1a202c;
        }

        .dashboard-header select {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          color: #2d3748;
          cursor: pointer;
          outline: none;
        }

        .dashboard-header select:focus {
          border-color: #4A6CF7;
          box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.1);
        }

        .error-message {
          padding: 12px 16px;
          background: #fed7d7;
          color: #c53030;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .loading-state {
          text-align: center;
          padding: 40px 0;
          color: #718096;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .stat-label {
          display: block;
          font-size: 14px;
          color: #718096;
          margin-bottom: 8px;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 600;
          color: #2d3748;
        }

        .products-section {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .products-section h2 {
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
        }

        .empty-state {
          text-align: center;
          padding: 32px 0;
          color: #a0aec0;
        }

        .products-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .product-item {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          background: #f7fafc;
          transition: background 0.2s;
        }

        .product-item:hover {
          background: #edf2f7;
        }

        .product-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 180px;
        }

        .product-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          flex-shrink: 0;
          font-size: 16px;
        }

        .product-details {
          flex: 1;
          min-width: 0;
        }

        .product-name {
          font-weight: 500;
          color: #2d3748;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-sku {
          font-size: 13px;
          color: #a0aec0;
        }

        .product-stats {
          flex: 1;
          min-width: 200px;
        }

        .product-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 8px;
        }

        .metric {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }

        .metric-label {
          color: #a0aec0;
        }

        .metric-value {
          font-weight: 500;
          color: #2d3748;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        @media (max-width: 640px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-header h1 {
            font-size: 22px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .product-item {
            flex-direction: column;
            align-items: stretch;
          }

          .product-info {
            min-width: unset;
          }

          .product-stats {
            min-width: unset;
          }

          .product-metrics {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}