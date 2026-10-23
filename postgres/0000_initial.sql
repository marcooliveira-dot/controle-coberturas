CREATE TABLE members (
 email TEXT PRIMARY KEY, user_id TEXT UNIQUE, name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','supervisor')),
 primary_admin INTEGER NOT NULL DEFAULT 0, password_hash TEXT,
 disabled INTEGER NOT NULL DEFAULT 0, failed_attempts INTEGER NOT NULL DEFAULT 0,
 locked_until BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_one_primary_admin ON members(primary_admin) WHERE primary_admin=1;
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES members(user_id), expires_at BIGINT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE TABLE invitations (
 token_hash TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES members(email), expires_at BIGINT NOT NULL
);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE TABLE auth_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_start BIGINT NOT NULL);
CREATE TABLE dashboard_settings (
 id INTEGER PRIMARY KEY, monthly_limit_cents INTEGER NOT NULL DEFAULT 500000,
 updated_by TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE coverages (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, owner_name TEXT NOT NULL, owner_email TEXT NOT NULL,
 created_at TEXT NOT NULL, name TEXT NOT NULL, cpf TEXT NOT NULL, operation TEXT NOT NULL,
 start TEXT NOT NULL, "end" TEXT NOT NULL, month TEXT NOT NULL, weekdays TEXT NOT NULL,
 justification TEXT NOT NULL, details TEXT NOT NULL, pix TEXT NOT NULL, third_party TEXT NOT NULL,
 daily_cents INTEGER NOT NULL, days INTEGER NOT NULL, total_cents BIGINT NOT NULL,
 service_type TEXT NOT NULL DEFAULT 'cobertura' CHECK(service_type IN ('cobertura','apoio_operacional'))
);
CREATE INDEX idx_coverages_owner_month ON coverages(owner_id,month);
CREATE INDEX idx_coverages_month ON coverages(month);
CREATE TABLE coverage_finance (
 coverage_id TEXT PRIMARY KEY REFERENCES coverages(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','paid')),
 rejection_reason TEXT NOT NULL DEFAULT '', paid_on TEXT, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE finance_events (
 id TEXT PRIMARY KEY, coverage_id TEXT NOT NULL REFERENCES coverages(id),
 action TEXT NOT NULL, actor TEXT NOT NULL, at TEXT NOT NULL, note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_finance_events_coverage ON finance_events(coverage_id);
