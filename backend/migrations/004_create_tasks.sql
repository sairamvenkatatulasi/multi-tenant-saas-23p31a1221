CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR DEFAULT 'todo',
  priority VARCHAR DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
