CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    contact_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    project_type TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning',
    contract_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    budget_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    planned_finish_date DATE NOT NULL,
    progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_items (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    planned_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    budget_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    UNIQUE (project_id, code)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    supplier_type TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    stock_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 0,
    average_cost NUMERIC(12, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_no TEXT NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    status TEXT NOT NULL DEFAULT 'draft',
    order_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    ordered_at DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS material_usages (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    work_item_id INTEGER NOT NULL REFERENCES work_items(id),
    material_id INTEGER NOT NULL REFERENCES materials(id),
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    used_on DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS cost_entries (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    work_item_id INTEGER REFERENCES work_items(id),
    cost_type TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    incurred_on DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_claims (
    id SERIAL PRIMARY KEY,
    claim_no TEXT NOT NULL UNIQUE,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    status TEXT NOT NULL DEFAULT 'draft',
    claim_period TEXT NOT NULL,
    claimed_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    retention_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    approved_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    submitted_on DATE NOT NULL
);

INSERT INTO clients (name, contact_name, phone)
VALUES
    ('Taipei City Public Works Office', 'Ms. Chen', '+886-2-2720-0001'),
    ('Northern Expressway Bureau', 'Mr. Lin', '+886-2-2345-0002'),
    ('Metro Construction Department', 'Ms. Huang', '+886-2-2500-0003')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name, supplier_type, phone)
VALUES
    ('Evergreen Cement Supply', 'material', '+886-3-555-0101'),
    ('Formosa Grouting Services', 'subcontractor', '+886-3-555-0102'),
    ('Mingde Heavy Equipment Rental', 'equipment', '+886-3-555-0103'),
    ('North Star Rebar Works', 'subcontractor', '+886-3-555-0104')
ON CONFLICT (name) DO NOTHING;

INSERT INTO materials (sku, name, unit, stock_quantity, reorder_level, average_cost)
VALUES
    ('MAT-CEM-001', 'Portland Cement', 'bag', 520, 200, 165.00),
    ('MAT-GRT-210', 'Microfine Grout', 'kg', 1850, 600, 42.00),
    ('MAT-RBR-016', 'D16 Rebar', 'ton', 18, 8, 21600.00),
    ('MAT-SHT-300', 'Steel Sheet Pile', 'piece', 36, 20, 3800.00)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO projects (
    code, name, client_id, project_type, location, status, contract_amount,
    budget_amount, start_date, planned_finish_date, progress_percent
)
SELECT 'PRJ-TUN-2601', 'Xinyi Utility Tunnel Extension', id, 'tunneling', 'Taipei Xinyi District',
       'in_progress', 128000000.00, 112500000.00, DATE '2026-01-15', DATE '2027-03-31', 38.50
FROM clients
WHERE name = 'Taipei City Public Works Office'
ON CONFLICT (code) DO NOTHING;

INSERT INTO projects (
    code, name, client_id, project_type, location, status, contract_amount,
    budget_amount, start_date, planned_finish_date, progress_percent
)
SELECT 'PRJ-GRT-2602', 'Linkou Ground Improvement Phase 2', id, 'ground_improvement', 'New Taipei Linkou',
       'in_progress', 46500000.00, 39100000.00, DATE '2026-02-10', DATE '2026-11-30', 52.00
FROM clients
WHERE name = 'Northern Expressway Bureau'
ON CONFLICT (code) DO NOTHING;

INSERT INTO projects (
    code, name, client_id, project_type, location, status, contract_amount,
    budget_amount, start_date, planned_finish_date, progress_percent
)
SELECT 'PRJ-IMP-2603', 'Station Drainage Improvement Works', id, 'improvement', 'Taoyuan Metro Station A7',
       'planning', 23800000.00, 20500000.00, DATE '2026-05-01', DATE '2026-12-20', 12.00
FROM clients
WHERE name = 'Metro Construction Department'
ON CONFLICT (code) DO NOTHING;

INSERT INTO work_items (project_id, code, name, category, unit, planned_quantity, unit_price, budget_amount)
SELECT p.id, item.code, item.name, item.category, item.unit, item.qty, item.price, item.budget
FROM projects p
JOIN (
    VALUES
        ('PRJ-TUN-2601', 'TUN-EXC', 'Tunnel excavation', 'labor', 'm', 420.00, 86000.00, 36120000.00),
        ('PRJ-TUN-2601', 'TUN-SUP', 'Initial support and lining', 'subcontract', 'm', 420.00, 94000.00, 39480000.00),
        ('PRJ-TUN-2601', 'TUN-DRA', 'Drainage and utility relocation', 'material', 'lot', 1.00, 18900000.00, 18900000.00),
        ('PRJ-GRT-2602', 'GRT-DRL', 'Drilling and hole preparation', 'equipment', 'hole', 220.00, 42000.00, 9240000.00),
        ('PRJ-GRT-2602', 'GRT-INJ', 'Pressure grouting', 'material', 'hole', 220.00, 88000.00, 19360000.00),
        ('PRJ-GRT-2602', 'GRT-QA', 'Verification testing', 'quality', 'lot', 1.00, 3200000.00, 3200000.00),
        ('PRJ-IMP-2603', 'IMP-DEM', 'Existing structure removal', 'labor', 'lot', 1.00, 4200000.00, 4200000.00),
        ('PRJ-IMP-2603', 'IMP-DRN', 'Drainage channel reconstruction', 'subcontract', 'm', 180.00, 52000.00, 9360000.00),
        ('PRJ-IMP-2603', 'IMP-PAV', 'Pavement restoration', 'material', 'm2', 1200.00, 2600.00, 3120000.00)
) AS item(project_code, code, name, category, unit, qty, price, budget)
    ON p.code = item.project_code
ON CONFLICT (project_id, code) DO NOTHING;

INSERT INTO purchase_orders (po_no, project_id, supplier_id, status, order_amount, ordered_at)
SELECT po.po_no, p.id, s.id, po.status, po.amount, po.ordered_at
FROM (
    VALUES
        ('PO-2601-001', 'PRJ-TUN-2601', 'Mingde Heavy Equipment Rental', 'approved', 6250000.00, DATE '2026-01-22'),
        ('PO-2601-002', 'PRJ-TUN-2601', 'North Star Rebar Works', 'received', 12800000.00, DATE '2026-02-03'),
        ('PO-2602-001', 'PRJ-GRT-2602', 'Evergreen Cement Supply', 'received', 4350000.00, DATE '2026-02-20'),
        ('PO-2602-002', 'PRJ-GRT-2602', 'Formosa Grouting Services', 'approved', 9200000.00, DATE '2026-03-05')
) AS po(po_no, project_code, supplier_name, status, amount, ordered_at)
JOIN projects p ON p.code = po.project_code
JOIN suppliers s ON s.name = po.supplier_name
ON CONFLICT (po_no) DO NOTHING;

INSERT INTO material_usages (project_id, work_item_id, material_id, quantity, cost_amount, used_on)
SELECT p.id, wi.id, m.id, usage.quantity, usage.cost_amount, usage.used_on
FROM (
    VALUES
        ('PRJ-TUN-2601', 'TUN-SUP', 'MAT-RBR-016', 7.50, 162000.00, DATE '2026-03-12'),
        ('PRJ-TUN-2601', 'TUN-DRA', 'MAT-SHT-300', 18.00, 68400.00, DATE '2026-03-18'),
        ('PRJ-GRT-2602', 'GRT-INJ', 'MAT-CEM-001', 380.00, 62700.00, DATE '2026-03-22'),
        ('PRJ-GRT-2602', 'GRT-INJ', 'MAT-GRT-210', 920.00, 38640.00, DATE '2026-03-25')
) AS usage(project_code, work_item_code, material_sku, quantity, cost_amount, used_on)
JOIN projects p ON p.code = usage.project_code
JOIN work_items wi ON wi.project_id = p.id AND wi.code = usage.work_item_code
JOIN materials m ON m.sku = usage.material_sku;

INSERT INTO cost_entries (project_id, work_item_id, cost_type, description, amount, incurred_on)
SELECT p.id, wi.id, entry.cost_type, entry.description, entry.amount, entry.incurred_on
FROM (
    VALUES
        ('PRJ-TUN-2601', 'TUN-EXC', 'labor', 'Tunnel crew payroll and allowances', 12150000.00, DATE '2026-04-30'),
        ('PRJ-TUN-2601', 'TUN-SUP', 'subcontract', 'Initial support subcontract progress payment', 18400000.00, DATE '2026-04-30'),
        ('PRJ-TUN-2601', 'TUN-DRA', 'equipment', 'Drainage pumping equipment rental', 2650000.00, DATE '2026-04-30'),
        ('PRJ-GRT-2602', 'GRT-DRL', 'equipment', 'Drilling rig rental and operators', 5150000.00, DATE '2026-04-30'),
        ('PRJ-GRT-2602', 'GRT-INJ', 'material', 'Grouting material consumption', 8730000.00, DATE '2026-04-30'),
        ('PRJ-GRT-2602', 'GRT-QA', 'quality', 'Core sampling and permeability tests', 1420000.00, DATE '2026-04-30'),
        ('PRJ-IMP-2603', 'IMP-DEM', 'labor', 'Removal crew mobilization', 980000.00, DATE '2026-05-20'),
        ('PRJ-IMP-2603', 'IMP-DRN', 'subcontract', 'Drainage subcontract advance payment', 2250000.00, DATE '2026-05-20')
) AS entry(project_code, work_item_code, cost_type, description, amount, incurred_on)
JOIN projects p ON p.code = entry.project_code
JOIN work_items wi ON wi.project_id = p.id AND wi.code = entry.work_item_code;

INSERT INTO payment_claims (
    claim_no, project_id, status, claim_period, claimed_amount,
    retention_amount, approved_amount, submitted_on
)
SELECT claim.claim_no, p.id, claim.status, claim.period, claim.claimed, claim.retention, claim.approved, claim.submitted_on
FROM (
    VALUES
        ('CLM-2601-01', 'PRJ-TUN-2601', 'approved', '2026-03', 18600000.00, 930000.00, 17670000.00, DATE '2026-04-05'),
        ('CLM-2601-02', 'PRJ-TUN-2601', 'submitted', '2026-04', 21100000.00, 1055000.00, 0.00, DATE '2026-05-05'),
        ('CLM-2602-01', 'PRJ-GRT-2602', 'approved', '2026-03', 9250000.00, 462500.00, 8787500.00, DATE '2026-04-03'),
        ('CLM-2602-02', 'PRJ-GRT-2602', 'submitted', '2026-04', 10800000.00, 540000.00, 0.00, DATE '2026-05-04')
) AS claim(claim_no, project_code, status, period, claimed, retention, approved, submitted_on)
JOIN projects p ON p.code = claim.project_code
ON CONFLICT (claim_no) DO NOTHING;
