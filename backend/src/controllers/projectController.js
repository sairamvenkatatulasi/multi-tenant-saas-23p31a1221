const db = require('../config/db');
const { v4: uuid } = require('uuid');
const log = require('../utils/auditLogger');


exports.createProject = async (req, res) => {
  const { tenantId, userId } = req.user;
  const { name, description } = req.body;

  // 1. Check project limit
  const countRes = await db.query(
    'SELECT COUNT(*) FROM projects WHERE tenant_id=$1',
    [tenantId]
  );

  const tenantRes = await db.query(
    'SELECT max_projects FROM tenants WHERE id=$1',
    [tenantId]
  );

  if (+countRes.rows[0].count >= tenantRes.rows[0].max_projects) {
    return res.status(403).json({
      success: false,
      message: 'Project limit reached'
    });
  }

  // 2. Insert project
  const projectId = uuid();
  await db.query(
    `INSERT INTO projects (id, tenant_id, name, description, created_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [projectId, tenantId, name, description, userId]
  );

  // 3. Audit log
  await log({
    tenantId,
    userId,
    action: 'CREATE_PROJECT',
    entityType: 'project',
    entityId: projectId,
    ip: req.ip
  });

  res.status(201).json({
    success: true,
    data: { id: projectId, name }
  });
};

exports.listProjects = async (req, res) => {
  const { tenantId } = req.user;

  const projects = await db.query(
    `SELECT p.id, p.name, p.description, p.status, p.created_at,
            COUNT(t.id) AS task_count
     FROM projects p
     LEFT JOIN tasks t ON t.project_id = p.id
     WHERE p.tenant_id = $1
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [tenantId]
  );

  res.json({
    success: true,
    data: { projects: projects.rows }
  });
};

exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const { name, description, status } = req.body;
  const { tenantId, userId, role } = req.user;

  // 1. Fetch project
  const projectRes = await db.query(
    'SELECT created_by FROM projects WHERE id=$1 AND tenant_id=$2',
    [projectId, tenantId]
  );

  if (projectRes.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // 2. Authorization
  if (role !== 'tenant_admin' && projectRes.rows[0].created_by !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }

  // 3. Update
  await db.query(
    `UPDATE projects SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      status = COALESCE($3, status)
     WHERE id=$4`,
    [name, description, status, projectId]
  );

  // 4. Audit log
  await log({
    tenantId,
    userId,
    action: 'UPDATE_PROJECT',
    entityType: 'project',
    entityId: projectId,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Project updated'
  });
};

exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId, userId, role } = req.user;

  const projectRes = await db.query(
    'SELECT created_by FROM projects WHERE id=$1 AND tenant_id=$2',
    [projectId, tenantId]
  );

  if (projectRes.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  if (role !== 'tenant_admin' && projectRes.rows[0].created_by !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden'
    });
  }

  await db.query('DELETE FROM projects WHERE id=$1', [projectId]);

  await log({
    tenantId,
    userId,
    action: 'DELETE_PROJECT',
    entityType: 'project',
    entityId: projectId,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Project deleted'
  });
};



