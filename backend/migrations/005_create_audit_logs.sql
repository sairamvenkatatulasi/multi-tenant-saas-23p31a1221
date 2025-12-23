CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  user_id UUID,
  action VARCHAR NOT NULL,
  entity_type VARCHAR,
  entity_id UUID,
  ip_address VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
