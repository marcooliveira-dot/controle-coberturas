ALTER TABLE coverages ADD COLUMN worked_dates TEXT;
ALTER TABLE coverages ADD COLUMN doubled_dates TEXT NOT NULL DEFAULT '[]';
