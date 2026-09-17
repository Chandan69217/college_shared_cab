-- ============================================================================
-- College Shared Cab & Shuttle Platform - Notifications & User Devices Schema
-- Migration: 20260917000000_notifications_and_user_devices.sql
-- ============================================================================

-- 1. Create user_devices table for push notification token management
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL DEFAULT 'android', -- 'android', 'ios', 'web'
    device_name VARCHAR(150),
    app_version VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_device_token UNIQUE(user_id, device_token)
);

-- 2. Enhance notifications table
ALTER TABLE notifications
    ALTER COLUMN type TYPE VARCHAR(100) USING type::text,
    ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(50),
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS entity_id UUID,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. Notification delivery audit logs (optional telemetry)
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    device_token TEXT,
    platform VARCHAR(20),
    provider VARCHAR(50) NOT NULL DEFAULT 'FCM',
    status VARCHAR(30) NOT NULL DEFAULT 'SENT', -- 'SENT', 'FAILED', 'DELIVERED'
    provider_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for high-performance notification querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_devices_user_active ON user_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS policy_user_view_own_notifications ON notifications;
CREATE POLICY policy_user_view_own_notifications ON notifications
    FOR SELECT USING (user_id = auth_user_id() OR auth_user_role() = 'ADMIN');

DROP POLICY IF EXISTS policy_user_update_own_notifications ON notifications;
CREATE POLICY policy_user_update_own_notifications ON notifications
    FOR UPDATE USING (user_id = auth_user_id() OR auth_user_role() = 'ADMIN');

DROP POLICY IF EXISTS policy_admin_all_notifications ON notifications;
CREATE POLICY policy_admin_all_notifications ON notifications
    FOR ALL USING (auth_user_role() = 'ADMIN');

DROP POLICY IF EXISTS policy_user_manage_devices ON user_devices;
CREATE POLICY policy_user_manage_devices ON user_devices
    FOR ALL USING (user_id = auth_user_id() OR auth_user_role() = 'ADMIN');
