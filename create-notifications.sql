-- Membuat enum untuk tipe notifikasi jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'status_update',
            'new_message',
            'new_feedback',
            'new_milestone',
            'milestone_update',
            'payment_update',
            'admin_action'
        );
    END IF;
END$$;

-- Membuat tabel notifications jika belum ada
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata JSONB
);