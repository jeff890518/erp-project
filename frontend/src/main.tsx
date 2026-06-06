import React from "react";
import ReactDOM from "react-dom/client";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Building2,
  ClipboardList,
  HardHat,
  ListChecks,
  ReceiptText,
} from "lucide-react";
import "./styles.css";

type Locale = "en" | "zh";
type View = "dashboard" | "projects" | "procurement" | "inventory" | "billing";

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
    metricsLabel: "Construction ERP metrics",
    activeProjects: "Active Projects",
    contractValue: "Contract Value",
    actualCost: "Actual Cost",
    approvedClaims: "Approved Claims",
    lowStock: "Low Stock",
    createProject: "Create Project",
    saveProject: "Save Project",
    updateProject: "Update Project",
    deleteProject: "Delete",
    confirmDeleteProject: "Delete this project?",
    code: "Code",
    viewDetails: "Details",
    backToDashboard: "Back",
    projectOverview: "Project Overview",
    schedule: "Schedule",
    startDate: "Start",
    plannedFinish: "Planned Finish",
    location: "Location",
    type: "Type",
    workBreakdown: "Work Breakdown",
    plannedQty: "Planned Qty",
    costUsage: "Cost Usage",
    noPurchaseOrders: "No purchase orders yet",
    noPaymentClaims: "No payment claims yet",
    teamAccessNote: "Team access model",
    teamAccessHint: "Project members and role-based permissions can be added after the detail workflow is stable.",
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
    metricsLabel: "工程 ERP 指標",
    activeProjects: "進行中工程",
    contractValue: "合約金額",
    actualCost: "實際成本",
    approvedClaims: "已核准請款",
    lowStock: "低庫存",
    createProject: "新增工程案",
    saveProject: "儲存工程案",
    updateProject: "更新工程案",
    deleteProject: "刪除",
    confirmDeleteProject: "確定刪除此工程案？",
    code: "編號",
    viewDetails: "詳情",
    backToDashboard: "返回",
    projectOverview: "工程案總覽",
    schedule: "工期",
    startDate: "開工",
    plannedFinish: "預計完工",
    location: "地點",
    type: "類型",
    workBreakdown: "工項成本",
    plannedQty: "預計數量",
    costUsage: "成本使用率",
    noPurchaseOrders: "尚無採購單",
    noPaymentClaims: "尚無請款單",
    teamAccessNote: "團隊權限模型",
    teamAccessHint: "等工程案詳情流程穩定後，可再加入工程成員與角色權限。",
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
  start_date: string;
  planned_finish_date: string;
};

type ProjectFormState = {
  code: string;
  name: string;
  client_name: string;
  project_type: string;
  location: string;
  status: string;
  contract_amount: string;
  budget_amount: string;
  start_date: string;
  planned_finish_date: string;
  progress_percent: string;
};

type WorkItem = {
  id: number;
  project_code: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  planned_quantity: string;
  budget_amount: string;
  actual_cost: string;
  cost_to_budget_percent: string;
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

async function sendJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `API request failed: ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
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

function date(value: string | undefined, locale: Locale) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-TW" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function datePlaceholder(locale: Locale) {
  return locale === "zh" ? "例：2026-06-01" : "e.g. 2026-06-01";
}

function App() {
  const [locale, setLocale] = React.useState<Locale>(() => {
    const savedLocale = window.localStorage.getItem("erp-locale");
    return savedLocale === "zh" || savedLocale === "en" ? savedLocale : "zh";
  });
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [projects, setProjects] = React.useState<ProjectCostCenter[]>([]);
  const [workItems, setWorkItems] = React.useState<WorkItem[]>([]);
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
  const [paymentClaims, setPaymentClaims] = React.useState<PaymentClaim[]>([]);
  const [activeView, setActiveView] = React.useState<View>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setError(null);
    try {
      const [dashboardSummary, projectRows, workItemRows, materialRows, purchaseOrderRows, paymentClaimRows] = await Promise.all([
      fetchJson<DashboardSummary>("/dashboard"),
      fetchJson<ProjectCostCenter[]>("/projects"),
      fetchJson<WorkItem[]>("/work-items"),
      fetchJson<Material[]>("/materials"),
      fetchJson<PurchaseOrder[]>("/purchase-orders"),
      fetchJson<PaymentClaim[]>("/payment-claims"),
    ]);
      setSummary(dashboardSummary);
      setProjects(projectRows);
      setWorkItems(workItemRows);
      setMaterials(materialRows);
      setPurchaseOrders(purchaseOrderRows);
      setPaymentClaims(paymentClaimRows);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const lowStockMaterials = materials.filter((material) => material.is_low_stock);
  const t = translations[locale];
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    window.localStorage.setItem("erp-locale", nextLocale);
  }

  function openProjectDetail(projectId: number) {
    setActiveView("projects");
    setSelectedProjectId(projectId);
    window.scrollTo({ top: 0 });
  }

  function closeProjectDetail() {
    setSelectedProjectId(null);
    window.scrollTo({ top: 0 });
  }

  function navigateTo(view: View) {
    setActiveView(view);
    setSelectedProjectId(null);
    window.scrollTo({ top: 0 });
  }

  async function createProject(project: ProjectFormState) {
    try {
      setError(null);
      await sendJson<ProjectCostCenter>("/projects", {
        method: "POST",
        body: JSON.stringify(project),
      });
      await loadData();
      setActiveView("projects");
    } catch (requestError) {
      setError((requestError as Error).message);
      throw requestError;
    }
  }

  async function updateProject(projectId: number, project: Partial<ProjectFormState>) {
    try {
      setError(null);
      await sendJson<ProjectCostCenter>(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(project),
      });
      await loadData();
    } catch (requestError) {
      setError((requestError as Error).message);
      throw requestError;
    }
  }

  async function deleteProject(projectId: number) {
    if (!window.confirm(t.confirmDeleteProject)) {
      return;
    }
    try {
      setError(null);
      await sendJson<void>(`/projects/${projectId}`, {
        method: "DELETE",
      });
      await loadData();
      setSelectedProjectId(null);
    } catch (requestError) {
      setError((requestError as Error).message);
    }
  }

  function renderActiveView() {
    if (activeView === "dashboard") {
      return (
        <section className="kpi-grid" aria-label={t.metricsLabel}>
          <Metric icon={<Building2 />} label={t.activeProjects} value={summary?.active_project_count ?? "-"} />
          <Metric icon={<Banknote />} label={t.contractValue} value={summary ? money(summary.total_contract_amount, locale) : "-"} />
          <Metric icon={<ClipboardList />} label={t.actualCost} value={summary ? money(summary.total_actual_cost, locale) : "-"} />
          <Metric icon={<ReceiptText />} label={t.approvedClaims} value={summary ? money(summary.total_approved_claims, locale) : "-"} />
          <Metric icon={<AlertTriangle />} label={t.lowStock} value={summary?.low_stock_count ?? "-"} />
        </section>
      );
    }

    if (activeView === "projects") {
      return (
        <section className="content-grid">
          <ProjectCreatePanel locale={locale} onCreate={createProject} t={t} />
          <section className="panel wide">
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
                    <button className="text-button" type="button" onClick={() => openProjectDetail(project.id)}>
                      {t.viewDetails}
                    </button>
                    <button className="text-button danger-button" type="button" onClick={() => deleteProject(project.id)}>
                      {t.deleteProject}
                    </button>
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
        </section>
      );
    }

    if (activeView === "procurement") {
      return (
        <section className="content-grid">
          <section className="panel wide">
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
        </section>
      );
    }

    if (activeView === "inventory") {
      return (
        <section className="content-grid">
          <section className="panel wide">
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
        </section>
      );
    }

    return (
      <section className="content-grid">
        <section className="panel wide">
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
    );
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
          <button className={activeView === "dashboard" && !selectedProject ? "active" : ""} type="button" onClick={() => navigateTo("dashboard")}>
            {t.navDashboard}
          </button>
          <button className={activeView === "projects" || selectedProject ? "active" : ""} type="button" onClick={() => navigateTo("projects")}>
            {t.navProjects}
          </button>
          <button className={activeView === "procurement" && !selectedProject ? "active" : ""} type="button" onClick={() => navigateTo("procurement")}>
            {t.navProcurement}
          </button>
          <button className={activeView === "inventory" && !selectedProject ? "active" : ""} type="button" onClick={() => navigateTo("inventory")}>
            {t.navInventory}
          </button>
          <button className={activeView === "billing" && !selectedProject ? "active" : ""} type="button" onClick={() => navigateTo("billing")}>
            {t.navBilling}
          </button>
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
          </div>
        </header>

        {error ? <div className="error-banner">{error}</div> : null}

        {selectedProject ? (
          <ProjectDetail
            locale={locale}
            onBack={closeProjectDetail}
            paymentClaims={paymentClaims.filter((claim) => claim.project_code === selectedProject.code)}
            project={selectedProject}
            purchaseOrders={purchaseOrders.filter((order) => order.project_code === selectedProject.code)}
            t={t}
            onUpdate={(project) => updateProject(selectedProject.id, project)}
            workItems={workItems.filter((workItem) => workItem.project_code === selectedProject.code)}
          />
        ) : renderActiveView()}
      </section>
    </main>
  );
}

function ProjectDetail({
  locale,
  onBack,
  onUpdate,
  paymentClaims,
  project,
  purchaseOrders,
  t,
  workItems,
}: {
  locale: Locale;
  onBack: () => void;
  onUpdate: (project: Partial<ProjectFormState>) => Promise<void>;
  paymentClaims: PaymentClaim[];
  project: ProjectCostCenter;
  purchaseOrders: PurchaseOrder[];
  t: (typeof translations)[Locale];
  workItems: WorkItem[];
}) {
  const [status, setStatus] = React.useState(project.status);
  const [progress, setProgress] = React.useState(project.progress_percent);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setStatus(project.status);
    setProgress(project.progress_percent);
  }, [project.progress_percent, project.status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate({
        progress_percent: progress,
        status,
      });
    } catch {
      // The parent renders the API error banner.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="detail-view">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={16} />
        {t.backToDashboard}
      </button>

      <section className="detail-hero">
        <div>
          <p className="eyebrow">{project.code}</p>
          <h2>{project.name}</h2>
          <span>
            {project.client_name} · {project.location}
          </span>
        </div>
        <span className="status-tag">{project.status.replace("_", " ")}</span>
      </section>

      <section className="kpi-grid detail-kpis" aria-label={t.projectOverview}>
        <Metric icon={<Banknote />} label={t.contractValue} value={money(project.contract_amount, locale)} />
        <Metric icon={<ClipboardList />} label={t.actualCost} value={money(project.actual_cost, locale)} />
        <Metric icon={<ReceiptText />} label={t.approvedClaims} value={money(project.approved_claims, locale)} />
        <Metric icon={<AlertTriangle />} label={t.costUsage} value={`${number(project.cost_to_budget_percent, locale)}%`} />
        <Metric icon={<ListChecks />} label={t.progress} value={`${number(project.progress_percent, locale)}%`} />
      </section>

      <section className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>{t.projectOverview}</h2>
            <span>{t.schedule}</span>
          </div>
          <div className="detail-list">
            <DetailItem label={t.type} value={project.project_type.replace("_", " ")} />
            <DetailItem label={t.location} value={project.location} />
            <DetailItem label={t.startDate} value={date(project.start_date, locale)} />
            <DetailItem label={t.plannedFinish} value={date(project.planned_finish_date, locale)} />
            <DetailItem label={t.margin} value={money(project.estimated_margin, locale)} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>{t.teamAccessNote}</h2>
          </div>
          <div className="access-note">
            <strong>{t.project}</strong>
            <p>{t.teamAccessHint}</p>
          </div>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <h2>{t.updateProject}</h2>
          </div>
          <form className="form-grid compact-form" onSubmit={handleSubmit}>
            <label>
              <span>{t.status}</span>
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="planning">planning</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="on_hold">on_hold</option>
              </select>
            </label>
            <label>
              <span>{t.progress}</span>
              <input
                max="100"
                min="0"
                step="0.01"
                type="number"
                value={progress}
                onChange={(event) => setProgress(event.target.value)}
              />
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">
              {t.updateProject}
            </button>
          </form>
        </section>

        <section className="panel wide">
          <div className="panel-header">
            <h2>{t.workBreakdown}</h2>
            <span>{workItems.length}</span>
          </div>
          <div className="table work-table">
            <div className="table-row table-head">
              <span>{t.project}</span>
              <span>{t.type}</span>
              <span>{t.plannedQty}</span>
              <span>{t.budget}</span>
              <span>{t.actual}</span>
              <span>{t.used}</span>
            </div>
            {workItems.map((workItem) => (
              <div className="table-row" key={workItem.id}>
                <span>
                  <strong>{workItem.code}</strong>
                  <small>{workItem.name}</small>
                </span>
                <span>{workItem.category}</span>
                <span>
                  {number(workItem.planned_quantity, locale)} {workItem.unit}
                </span>
                <span>{money(workItem.budget_amount, locale)}</span>
                <span>{money(workItem.actual_cost, locale)}</span>
                <span className={Number(workItem.cost_to_budget_percent) > 100 ? "danger" : ""}>
                  {number(workItem.cost_to_budget_percent, locale)}%
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>{t.navProcurement}</h2>
            <span>
              {purchaseOrders.length} {t.purchaseOrders}
            </span>
          </div>
          <div className="compact-list">
            {purchaseOrders.length > 0 ? (
              purchaseOrders.map((order) => (
                <article className="list-item" key={order.id}>
                  <div>
                    <strong>{order.po_no}</strong>
                    <small>{order.supplier_name}</small>
                  </div>
                  <div>
                    <span className="status-tag">{order.status}</span>
                    <strong>{money(order.order_amount, locale)}</strong>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">{t.noPurchaseOrders}</p>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>{t.progressBilling}</h2>
            <span>
              {paymentClaims.length} {t.claims}
            </span>
          </div>
          <div className="compact-list">
            {paymentClaims.length > 0 ? (
              paymentClaims.map((claim) => (
                <article className="list-item" key={claim.id}>
                  <div>
                    <strong>{claim.claim_no}</strong>
                    <small>{claim.claim_period}</small>
                  </div>
                  <div>
                    <span className="status-tag">{claim.status}</span>
                    <strong>{money(claim.claimed_amount, locale)}</strong>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">{t.noPaymentClaims}</p>
            )}
          </div>
        </section>
      </section>
    </section>
  );
}

function ProjectCreatePanel({
  locale,
  onCreate,
  t,
}: {
  locale: Locale;
  onCreate: (project: ProjectFormState) => Promise<void>;
  t: (typeof translations)[Locale];
}) {
  const [form, setForm] = React.useState<ProjectFormState>({
    code: "",
    name: "",
    client_name: "",
    project_type: "",
    location: "",
    status: "planning",
    contract_amount: "",
    budget_amount: "",
    start_date: "",
    planned_finish_date: "",
    progress_percent: "0",
  });
  const [isSaving, setIsSaving] = React.useState(false);

  function updateField(field: keyof ProjectFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await onCreate(form);
      setForm({
        code: "",
        name: "",
        client_name: "",
        project_type: "",
        location: "",
        status: "planning",
        contract_amount: "",
        budget_amount: "",
        start_date: "",
        planned_finish_date: "",
        progress_percent: "0",
      });
    } catch {
      // The parent renders the API error banner.
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel wide">
      <div className="panel-header">
        <h2>{t.createProject}</h2>
      </div>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          <span>{t.code}</span>
          <input required value={form.code} onChange={(event) => updateField("code", event.target.value)} />
        </label>
        <label>
          <span>{t.project}</span>
          <input required value={form.name} onChange={(event) => updateField("name", event.target.value)} />
        </label>
        <label>
          <span>{t.client}</span>
          <input required value={form.client_name} onChange={(event) => updateField("client_name", event.target.value)} />
        </label>
        <label>
          <span>{t.type}</span>
          <input required value={form.project_type} onChange={(event) => updateField("project_type", event.target.value)} />
        </label>
        <label>
          <span>{t.location}</span>
          <input required value={form.location} onChange={(event) => updateField("location", event.target.value)} />
        </label>
        <label>
          <span>{t.status}</span>
          <select value={form.status} onChange={(event) => updateField("status", event.target.value)}>
            <option value="planning">planning</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
            <option value="on_hold">on_hold</option>
          </select>
        </label>
        <label>
          <span>{t.contractValue}</span>
          <input min="0" required step="1" type="number" value={form.contract_amount} onChange={(event) => updateField("contract_amount", event.target.value)} />
        </label>
        <label>
          <span>{t.budget}</span>
          <input min="0" required step="1" type="number" value={form.budget_amount} onChange={(event) => updateField("budget_amount", event.target.value)} />
        </label>
        <label>
          <span>{t.startDate}</span>
          <input
            inputMode="numeric"
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
            placeholder={datePlaceholder(locale)}
            required
            value={form.start_date}
            onChange={(event) => updateField("start_date", event.target.value)}
          />
        </label>
        <label>
          <span>{t.plannedFinish}</span>
          <input
            inputMode="numeric"
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
            placeholder={datePlaceholder(locale)}
            required
            value={form.planned_finish_date}
            onChange={(event) => updateField("planned_finish_date", event.target.value)}
          />
        </label>
        <label>
          <span>{t.progress}</span>
          <input max="100" min="0" required step="0.01" type="number" value={form.progress_percent} onChange={(event) => updateField("progress_percent", event.target.value)} />
        </label>
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? t.saveProject : t.createProject}
        </button>
      </form>
      <small className="form-note">
        {t.contractValue}: {form.contract_amount ? money(form.contract_amount, locale) : "-"}
      </small>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
