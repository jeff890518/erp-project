import React from "react";
import ReactDOM from "react-dom/client";
import {
  AlertTriangle,
  Banknote,
  Building2,
  ClipboardList,
  HardHat,
  ReceiptText,
} from "lucide-react";
import "./styles.css";

type DashboardSummary = {
  active_project_count: number;
  total_contract_amount: string;
  total_budget_amount: string;
  total_actual_cost: string;
  total_approved_claims: string;
  low_stock_count: number;
  over_budget_project_count: number;
};

type ProjectCostCenter = {
  id: number;
  code: string;
  name: string;
  client_name: string;
  project_type: string;
  location: string;
  status: string;
  contract_amount: string;
  budget_amount: string;
  actual_cost: string;
  approved_claims: string;
  progress_percent: string;
  cost_to_budget_percent: string;
  estimated_margin: string;
  planned_finish_date: string;
};

type Material = {
  id: number;
  sku: string;
  name: string;
  unit: string;
  stock_quantity: string;
  reorder_level: string;
  average_cost: string;
  is_low_stock: boolean;
};

type PurchaseOrder = {
  id: number;
  po_no: string;
  project_code: string;
  supplier_name: string;
  status: string;
  order_amount: string;
  ordered_at: string;
};

type PaymentClaim = {
  id: number;
  claim_no: string;
  project_code: string;
  status: string;
  claim_period: string;
  claimed_amount: string;
  retention_amount: string;
  approved_amount: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function money(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function number(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function App() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [projects, setProjects] = React.useState<ProjectCostCenter[]>([]);
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
  const [paymentClaims, setPaymentClaims] = React.useState<PaymentClaim[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all([
      fetchJson<DashboardSummary>("/dashboard"),
      fetchJson<ProjectCostCenter[]>("/projects"),
      fetchJson<Material[]>("/materials"),
      fetchJson<PurchaseOrder[]>("/purchase-orders"),
      fetchJson<PaymentClaim[]>("/payment-claims"),
    ])
      .then(([dashboardSummary, projectRows, materialRows, purchaseOrderRows, paymentClaimRows]) => {
        setSummary(dashboardSummary);
        setProjects(projectRows);
        setMaterials(materialRows);
        setPurchaseOrders(purchaseOrderRows);
        setPaymentClaims(paymentClaimRows);
      })
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  const lowStockMaterials = materials.filter((material) => material.is_low_stock);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <HardHat size={25} />
          <div>
            <strong>Construction ERP</strong>
            <span>Cost Center Ops</span>
          </div>
        </div>
        <nav>
          <a className="active" href="#dashboard">
            Dashboard
          </a>
          <a href="#projects">Projects</a>
          <a href="#procurement">Procurement</a>
          <a href="#inventory">Inventory</a>
          <a href="#billing">Billing</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Project-Based Costing</p>
            <h1>Construction ERP</h1>
          </div>
          <span className="status-pill">Docker Local Stack</span>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="kpi-grid" id="dashboard" aria-label="Construction ERP metrics">
          <Metric icon={<Building2 />} label="Active Projects" value={summary?.active_project_count ?? "-"} />
          <Metric icon={<Banknote />} label="Contract Value" value={summary ? money(summary.total_contract_amount) : "-"} />
          <Metric icon={<ClipboardList />} label="Actual Cost" value={summary ? money(summary.total_actual_cost) : "-"} />
          <Metric icon={<ReceiptText />} label="Approved Claims" value={summary ? money(summary.total_approved_claims) : "-"} />
          <Metric icon={<AlertTriangle />} label="Low Stock" value={summary?.low_stock_count ?? "-"} />
        </section>

        <section className="content-grid">
          <section className="panel wide" id="projects">
            <div className="panel-header">
              <h2>Project Cost Centers</h2>
              <span>{summary?.over_budget_project_count ?? 0} over budget</span>
            </div>
            <div className="table project-table">
              <div className="table-row table-head">
                <span>Project</span>
                <span>Client</span>
                <span>Progress</span>
                <span>Budget</span>
                <span>Actual</span>
                <span>Margin</span>
              </div>
              {projects.map((project) => (
                <div className="table-row" key={project.id}>
                  <span>
                    <strong>{project.code}</strong>
                    <small>{project.name}</small>
                  </span>
                  <span>
                    {project.client_name}
                    <small>{project.location}</small>
                  </span>
                  <span>
                    {number(project.progress_percent)}%
                    <small>{project.status.replace("_", " ")}</small>
                  </span>
                  <span>{money(project.budget_amount)}</span>
                  <span className={Number(project.cost_to_budget_percent) > 100 ? "danger" : ""}>
                    {money(project.actual_cost)}
                    <small>{number(project.cost_to_budget_percent)}% used</small>
                  </span>
                  <span className={Number(project.estimated_margin) < 0 ? "danger" : "positive"}>
                    {money(project.estimated_margin)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel" id="procurement">
            <div className="panel-header">
              <h2>Procurement</h2>
              <span>{purchaseOrders.length} purchase orders</span>
            </div>
            <div className="compact-list">
              {purchaseOrders.map((order) => (
                <article className="list-item" key={order.id}>
                  <div>
                    <strong>{order.po_no}</strong>
                    <span>{order.project_code}</span>
                    <small>{order.supplier_name}</small>
                  </div>
                  <div>
                    <span className="status-tag">{order.status}</span>
                    <strong>{money(order.order_amount)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" id="inventory">
            <div className="panel-header">
              <h2>Materials</h2>
              <span>{lowStockMaterials.length} need replenishment</span>
            </div>
            <div className="compact-list">
              {materials.map((material) => (
                <article className="list-item" key={material.id}>
                  <div>
                    <strong>{material.sku}</strong>
                    <span>{material.name}</span>
                    <small>{money(material.average_cost)} / {material.unit}</small>
                  </div>
                  <div>
                    <span className={material.is_low_stock ? "danger" : ""}>
                      {number(material.stock_quantity)} {material.unit}
                    </span>
                    <small>Reorder {number(material.reorder_level)}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel wide" id="billing">
            <div className="panel-header">
              <h2>Progress Billing</h2>
              <span>{paymentClaims.length} claims</span>
            </div>
            <div className="table claims-table">
              <div className="table-row table-head">
                <span>Claim</span>
                <span>Project</span>
                <span>Period</span>
                <span>Status</span>
                <span>Claimed</span>
                <span>Approved</span>
              </div>
              {paymentClaims.map((claim) => (
                <div className="table-row" key={claim.id}>
                  <span>{claim.claim_no}</span>
                  <span>{claim.project_code}</span>
                  <span>{claim.claim_period}</span>
                  <span>
                    <span className="status-tag">{claim.status}</span>
                  </span>
                  <span>{money(claim.claimed_amount)}</span>
                  <span>{money(claim.approved_amount)}</span>
                </div>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
