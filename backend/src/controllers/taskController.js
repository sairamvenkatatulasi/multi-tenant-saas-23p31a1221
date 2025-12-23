const db = require('../config/db');
const { v4: uuid } = require('uuid');
const log = require('../utils/auditLogger');

exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description, assignedTo, priority = 'medium', dueDate } = req.body;
  const { userId, tenantId } = req.user;

  // 1. Get project tenant
  const projectRes = await db.query(
    'SELECT tenant_id FROM projects WHERE id=$1',
    [projectId]
  );

  if (projectRes.rowCount === 0)
    return res.status(404).json({ success:false, message:'Project not found' });

  const projectTenantId = projectRes.rows[0].tenant_id;

  // 2. Tenant isolation
  if (projectTenantId !== tenantId)
    return res.status(403).json({ success:false, message:'Forbidden' });

  // 3. Validate assigned user
  if (assignedTo) {
    const userRes = await db.query(
      'SELECT id FROM users WHERE id=$1 AND tenant_id=$2',
      [assignedTo, tenantId]
    );
    if (userRes.rowCount === 0)
      return res.status(400).json({ success:false, message:'Invalid assignee' });
  }

  // 4. Create task
  const taskId = uuid();
  await db.query(
    `INSERT INTO tasks
     (id, project_id, tenant_id, title, description, priority, assigned_to, due_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [taskId, projectId, projectTenantId, title, description, priority, assignedTo, dueDate]
  );

  // 5. Audit log
  await log({
    tenantId: projectTenantId,
    userId,
    action: 'CREATE_TASK',
    entityType: 'task',
    entityId: taskId,
    ip: req.ip
  });

  res.status(201).json({ success:true, data:{ id: taskId, title } });
};

exports.listProjectTasks = async (req, res) => {
  const { projectId } = req.params;
  const { tenantId } = req.user;

  const projectRes = await db.query(
    'SELECT tenant_id FROM projects WHERE id=$1',
    [projectId]
  );

  if (projectRes.rowCount === 0)
    return res.status(404).json({ success:false, message:'Project not found' });

  if (projectRes.rows[0].tenant_id !== tenantId)
    return res.status(403).json({ success:false, message:'Forbidden' });

  const tasks = await db.query(
    `SELECT t.*, u.full_name, u.email
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.project_id=$1
     ORDER BY t.priority DESC, t.due_date ASC`,
    [projectId]
  );

  res.json({ success:true, data:{ tasks: tasks.rows } });
};


exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const { tenantId, userId } = req.user;

  const taskRes = await db.query(
    'SELECT tenant_id FROM tasks WHERE id=$1',
    [taskId]
  );

  if (taskRes.rowCount === 0)
    return res.status(404).json({ success:false, message:'Task not found' });

  if (taskRes.rows[0].tenant_id !== tenantId)
    return res.status(403).json({ success:false, message:'Forbidden' });

  await db.query(
    'UPDATE tasks SET status=$1 WHERE id=$2',
    [status, taskId]
  );

  await log({
    tenantId,
    userId,
    action: 'UPDATE_TASK_STATUS',
    entityType: 'task',
    entityId: taskId,
    ip: req.ip
  });

  res.json({ success:true, message:'Task status updated' });
};


exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const { title, description, status, priority, assignedTo, dueDate } = req.body;
  const { tenantId, userId } = req.user;

  const taskRes = await db.query(
    'SELECT tenant_id FROM tasks WHERE id=$1',
    [taskId]
  );

  if (taskRes.rowCount === 0)
    return res.status(404).json({ success:false, message:'Task not found' });

  if (taskRes.rows[0].tenant_id !== tenantId)
    return res.status(403).json({ success:false, message:'Forbidden' });

  if (assignedTo) {
    const userRes = await db.query(
      'SELECT id FROM users WHERE id=$1 AND tenant_id=$2',
      [assignedTo, tenantId]
    );
    if (userRes.rowCount === 0)
      return res.status(400).json({ success:false, message:'Invalid assignee' });
  }

  await db.query(
    `UPDATE tasks SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      status = COALESCE($3, status),
      priority = COALESCE($4, priority),
      assigned_to = $5,
      due_date = $6
     WHERE id=$7`,
    [title, description, status, priority, assignedTo, dueDate, taskId]
  );

  await log({
    tenantId,
    userId,
    action: 'UPDATE_TASK',
    entityType: 'task',
    entityId: taskId,
    ip: req.ip
  });

  res.json({ success:true, message:'Task updated' });
};


