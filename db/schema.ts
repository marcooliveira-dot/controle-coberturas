// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const members = sqliteTable('members', {
 email:text('email').primaryKey(), userId:text('user_id').unique(), name:text('name').notNull(), role:text('role').notNull(), primary:integer('primary_admin').notNull().default(0)
});
export const coverages = sqliteTable('coverages', {
 id:text('id').primaryKey(), ownerId:text('owner_id').notNull(), ownerName:text('owner_name').notNull(), ownerEmail:text('owner_email').notNull(), createdAt:text('created_at').notNull(), name:text('name').notNull(), cpf:text('cpf').notNull(), operation:text('operation').notNull(), start:text('start').notNull(), end:text('end').notNull(), month:text('month').notNull(), weekdays:text('weekdays').notNull(), justification:text('justification').notNull(), details:text('details').notNull(), pix:text('pix').notNull(), thirdParty:text('third_party').notNull(), dailyCents:integer('daily_cents').notNull(), days:integer('days').notNull(), totalCents:integer('total_cents').notNull()
},t=>[index('idx_coverages_owner_month').on(t.ownerId,t.month),index('idx_coverages_month').on(t.month)]);
