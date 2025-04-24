-- Buat enum untuk tipe widget
CREATE TYPE widget_type AS ENUM (
  'project_status',
  'project_progress',
  'recent_activities',
  'upcoming_milestones',
  'invoice_summary',
  'payment_summary',
  'message_count',
  'task_list',
  'calendar',
  'quick_links',
  'chart',
  'custom'
);

-- Tabel untuk mendefinisikan semua widget yang tersedia
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type widget_type NOT NULL,
  icon TEXT NOT NULL,
  default_width INTEGER NOT NULL DEFAULT 1,
  default_height INTEGER NOT NULL DEFAULT 1,
  default_config JSONB,
  available_to_roles TEXT[] NOT NULL DEFAULT '{client,admin}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabel untuk menyimpan konfigurasi widget user
CREATE TABLE IF NOT EXISTS user_widgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  widget_id INTEGER NOT NULL REFERENCES dashboard_widgets(id),
  position INTEGER NOT NULL,
  grid_x INTEGER NOT NULL DEFAULT 0,
  grid_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1,
  height INTEGER NOT NULL DEFAULT 1,
  config JSONB,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert beberapa widget default
INSERT INTO dashboard_widgets (name, description, type, icon, default_width, default_height, default_config, available_to_roles)
VALUES 
  ('Project Status', 'Menampilkan status proyek terkini', 'project_status', 'activity', 3, 1, '{"showProgress": true, "showTimeline": true}', '{client,admin}'),
  ('Project Progress', 'Menampilkan progres proyek dalam persentase', 'project_progress', 'percent', 3, 2, '{"showChart": true, "showMilestones": true}', '{client,admin}'),
  ('Recent Activities', 'Menampilkan aktivitas terbaru dari semua proyek', 'recent_activities', 'history', 4, 3, '{"limit": 5, "showDate": true}', '{client,admin}'),
  ('Upcoming Milestones', 'Menampilkan milestone yang akan datang', 'upcoming_milestones', 'calendar', 4, 2, '{"limit": 3, "showDeadline": true}', '{client,admin}'),
  ('Invoice Summary', 'Ringkasan invoice dan status pembayaran', 'invoice_summary', 'credit-card', 3, 2, '{"showOverdue": true, "showRecent": true}', '{client,admin}'),
  ('Payment Summary', 'Ringkasan pembayaran yang telah dilakukan', 'payment_summary', 'dollar-sign', 3, 2, '{"showTotal": true, "showRecent": true}', '{client,admin}'),
  ('Message Count', 'Jumlah pesan yang belum dibaca', 'message_count', 'message-circle', 1, 1, '{"showUnread": true}', '{client,admin}'),
  ('Task List', 'Daftar tugas yang perlu dilakukan', 'task_list', 'check-square', 3, 3, '{"showCompleted": false, "limit": 5}', '{client,admin}'),
  ('Calendar', 'Kalender untuk melihat deadline dan jadwal', 'calendar', 'calendar', 4, 4, '{"showDeadlines": true, "showMilestones": true}', '{client,admin}'),
  ('Quick Links', 'Tautan cepat ke halaman yang sering dikunjungi', 'quick_links', 'external-link', 2, 2, '{"links": [{"name": "Projects", "url": "/projects"}, {"name": "Invoices", "url": "/invoices"}]}', '{client,admin}'),
  ('Chart', 'Grafik dan statistik', 'chart', 'bar-chart-2', 4, 3, '{"type": "bar", "showLegend": true}', '{client,admin}');