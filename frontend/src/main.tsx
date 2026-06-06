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

type Locale = "en" | "zh";

const translations = {
  en: {
    appName: "Construction ERP",
    subtitle: "Cost Center Ops",
    navDashboard: "Dashboard",
    navProjects: "Projects",
    navProcurement: "Procurement",
    navInventory: "Inventory",
    navBilling: "Billing",
    eyebrow: "Project-Based Costing",
    localStack: "Docker Local Stack",
    metricsLabel: "Construction ERP metrics",
    activeProjects: "Active Projects",
    contractValue: "Contract Value",
    actualCost: "Actual Cost",
    approvedClaims: "Approved Claims",
    lowStock: "Low Stock",
    projectCostCenters: "Project Cost Centers",
    overBudget: "over budget",
    project: "Project",
    client: "Client",
    progress: "Progress",
    budget: "Budget",
    actual: "Actual",
    margin: "Margin",
    used: "used",
    purchaseOrders: "purchase orders",
    materials: "Materials",
    needReplenishment: "need replenishment",
    reorder: "Reorder",
    progressBilling: "Progress Billing",
    claims: "claims",
    claim: "Claim",
    period: "Period",
    status: "Status",
    claimed: "Claimed",
    approved: "Approved",
    language: "Language",
  },
  zh: {
    appName: "工程 ERP",
    subtitle: "成本中心營運",
    navDashboard: "儀表板",
    navProjects: "工程案",
    navProcurement: "採購",
    navInventory: "庫存",
    navBilling: "估驗請款",
    eyebrow: "工程案成本中心",
    localStack: "本機 Docker 環境",
    metricsLabel: "工程 ERP 指標",
    activeProjects: "進行中工程",
    contractValue: "合約金額",
    actualCost: "實際成本",
    approvedClaims: "已核准請款",
    lowStock: "低庫存",
    projectCostCenters: "工程案成本中心",
    overBudget: "件超出預算",
    project: "工程案",
    client: "業主",
    progress: "進度",
    budget: "預算",
    actual: "實際",
    margin: "毛利估算",
    used: "已使用",
    purchaseOrders: "張採購單",
    materials: "材料",
    needReplenishment: "項需補貨",
    reorder: "安全庫存",
    progressBilling: "估驗請款",
    claims: "筆請款",
    claim: "請款單",
    period: "期別",
    status: "狀態",
    claimed: "請款金額",
    approved: "核准金額",
    language: "語系",
  },
} satisfies Record<Locale, Record<string, string>>;

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

function money(value: string | number, locale: Locale) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-TW" : "en-US", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function number(value: string | number, locale: Locale) {
  return new Intl.NumberFormat(locale === "zh" ? "zh-TW" : "en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function App() {
  const [locale, setLocale] = React.useState<Locale>(() => {
    const savedLocale = window.localStorage.getItem("erp-locale");
    return savedLocale === "zh" || savedLocale === "en" ? savedLocale : "zh";
  });
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
  const t = translations[locale];

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    window.localStorage.setItem("erp-locale", nextLocale);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <HardHat size={25} />
          <div>
            <strong>{t.appName}</strong>
            <span>{t.subtitle}</span>
          </div>
        </div>
        <nav>
          <a className="active" href="#dashboard">
            {t.navDashboard}
          </a>
          <a href="#projects">{t.navProjects}</a>
          <a href="#procurement">{t.navProcurement}</a>
          <a href="#inventory">{t.navInventory}</a>
          <a href="#billing">{t.navBilling}</a>
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.appName}</h1>
          </div>
          <div className="topbar-actions">
            <div className="language-switcher" aria-label={t.language}>
              <button className={locale === "zh" ? "active" : ""} type="button" onClick={() => changeLocale("zh")}>
                中文
              </button>
              <button className={locale === "en" ? "active" : ""} type="button" onClick={() => changeLocale("en")}>
                EN
              </button>
            </div>
            <span className="status-pill">{t.localStack}</span>
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        <section className="kpi-grid" id="dashboard" aria-label={t.metricsLabel}>
          <Metric icon={<Building2 />} label={t.activeProjects} value={summary?.active_project_count ?? "-"} />
          <Metric icon={<Banknote />} label={t.contractValue} value={summary ? money(summary.total_contract_amount, locale) : "-"} />
          <Metric icon={<ClipboardList />} label={t.actualCost} value={summary ? money(summary.total_actual_cost, locale) : "-"} />
          <Metric icon={<ReceiptText />} label={t.approvedClaims} value={summary ? money(summary.total_approved_claims, locale) : "-"} />
          <Metric icon={<AlertTriangle />} label={t.lowStock} value={summary?.low_stock_count ?? "-"} />
        </section>

        <section className="content-grid">
          <section className="panel wide" id="projects">
            <div className="panel-header">
              <h2>{t.projectCostCenters}</h2>
              <span>
                {summary?.over_budget_project_count ?? 0} {t.overBudget}
              </span>
            </div>
            <div className="table project-table">
              <div className="table-row table-head">
                <span>{t.project}</span>
                <span>{t.client}</span>
                <span>{t.progress}</span>
                <span>{t.budget}</span>
                <span>{t.actual}</span>
                <span>{t.margin}</span>
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
                    {number(project.progress_percent, locale)}%
                    <small>{project.status.replace("_", " ")}</small>
                  </span>
                  <span>{money(project.budget_amount, locale)}</span>
                  <span className={Number(project.cost_to_budget_percent) > 100 ? "danger" : ""}>
                    {money(project.actual_cost, locale)}
                    <small>
                      {number(project.cost_to_budget_percent, locale)}% {t.used}
                    </small>
                  </span>
                  <span className={Number(project.estimated_margin) < 0 ? "danger" : "positive"}>
                    {money(project.estimated_margin, locale)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel" id="procurement">
            <div className="panel-header">
              <h2>{t.navProcurement}</h2>
              <span>
                {purchaseOrders.length} {t.purchaseOrders}
              </span>
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
                    <strong>{money(order.order_amount, locale)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel" id="inventory">
            <div className="panel-header">
              <h2>{t.materials}</h2>
              <span>
                {lowStockMaterials.length} {t.needReplenishment}
              </span>
            </div>
            <div className="compact-list">
              {materials.map((material) => (
                <article className="list-item" key={material.id}>
                  <div>
                    <strong>{material.sku}</strong>
                    <span>{material.name}</span>
                    <small>
                      {money(material.average_cost, locale)} / {material.unit}
                    </small>
                  </div>
                  <div>
                    <span className={material.is_low_stock ? "danger" : ""}>
                      {number(material.stock_quantity, locale)} {material.unit}
                    </span>
                    <small>
                      {t.reorder} {number(material.reorder_level, locale)}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel wide" id="billing">
            <div className="panel-header">
              <h2>{t.progressBilling}</h2>
              <span>
                {paymentClaims.length} {t.claims}
              </span>
            </div>
            <div className="table claims-table">
              <div className="table-row table-head">
                <span>{t.claim}</span>
                <span>{t.project}</span>
                <span>{t.period}</span>
                <span>{t.status}</span>
                <span>{t.claimed}</span>
                <span>{t.approved}</span>
              </div>
              {paymentClaims.map((claim) => (
                <div className="table-row" key={claim.id}>
                  <span>{claim.claim_no}</span>
                  <span>{claim.project_code}</span>
                  <span>{claim.claim_period}</span>
                  <span>
                    <span className="status-tag">{claim.status}</span>
                  </span>
                  <span>{money(claim.claimed_amount, locale)}</span>
                  <span>{money(claim.approved_amount, locale)}</span>
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
