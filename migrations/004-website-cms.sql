-- Website CMS: editable marketing content, sales enquiries, cookie-free
-- page-view counts and staff roles for the admin console.

-- One row per editable section ("home", "faq", "seo", ...). draft and
-- published hold JSON text. No row (or NULL published) means the public
-- site shows the original built-in content.
CREATE TABLE cms_content (
  key TEXT PRIMARY KEY,
  draft TEXT,
  published TEXT,
  draft_updated_at TEXT,
  draft_updated_by TEXT,
  published_at TEXT,
  published_by TEXT
);

-- Page views. visitor is a daily-salted hash of IP + user agent, so the
-- same person cannot be followed from one day to the next and no cookie is set.
CREATE TABLE cms_pageviews (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  path TEXT NOT NULL,
  visitor TEXT NOT NULL,
  device TEXT NOT NULL,
  referrer TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_cms_pageviews_day ON cms_pageviews(day);

-- Enquiries sent from the public contact form.
CREATE TABLE enquiries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  city TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT NOT NULL DEFAULT '[]',
  follow_up_on TEXT,
  assigned_to TEXT,
  source_path TEXT,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_enquiries_created ON enquiries(created_at);
CREATE INDEX idx_enquiries_status ON enquiries(status);

-- Images uploaded through the website editor (the file itself lives in
-- Vercel Blob / the local uploads folder; this is the index of them).
CREATE TABLE cms_media (
  name TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  uploaded_by TEXT,
  created_at TEXT NOT NULL
);

-- Staff role for ADMIN users: owner | administrator | editor | sales | viewer.
-- NULL means owner, so every admin that existed before this keeps full access.
ALTER TABLE users ADD COLUMN staff_role TEXT;
-- Sessions issued before this moment are refused ("sign out everywhere",
-- and immediately after a role change).
ALTER TABLE users ADD COLUMN sessions_valid_after TEXT;
