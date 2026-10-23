CREATE TABLE finance_attachments (
 id TEXT PRIMARY KEY,
 coverage_id TEXT NOT NULL REFERENCES coverages(id),
 filename TEXT NOT NULL,
 mime TEXT NOT NULL,
 size INTEGER NOT NULL CHECK(size>0 AND size<=5242880),
 content BYTEA NOT NULL,
 uploaded_by TEXT NOT NULL,
 uploaded_at TEXT NOT NULL
);
CREATE INDEX idx_finance_attachments_coverage ON finance_attachments(coverage_id);
