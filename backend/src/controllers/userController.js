const db = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');
const log = require('../utils/auditLogger');


exports.createUser = async (req, res) => {
  const { tenantId, userId } = req.user;
  const { email, password, fullName, role = 'user' } = req.body;

  // 1. Check user limit
  const countRes = await db.query(
    'SELECT COUNT(*) FROM users WHERE tenant_id=$1',
    [tenantId]
  );
  const tenantRes = await db.query(
    'SELECT max_users FROM tenants WHERE id=$1',
    [tenantId]
  );

  if (+countRes.rows[0].count >= tenantRes.rows[0].max_users) {
    return res.status(403).json({ success:false, message:'User limit reached' });
  }

  // 2. Hash password
  const hash = await bcrypt.hash(password, 10);

  // 3. Insert user
  const newUserId = uuid();
  await db.query(
    `INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [newUserId, tenantId, email, hash, fullName, role]
  );

  // 4. Audit log
  await log({
    tenantId,
    userId,
    action: 'CREATE_USER',
    entityType: 'user',
    entityId: newUserId,
    ip: req.ip
  });

  res.status(201).json({ success:true, message:'User created' });
};


exports.listUsers = async (req, res) => {
  const { tenantId } = req.user;

  const users = await db.query(
    `SELECT id, email, full_name, role, is_active, created_at
     FROM users WHERE tenant_id=$1
     ORDER BY created_at DESC`,
    [tenantId]
  );

  res.json({ success:true, data:{ users: users.rows } });
};


exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { fullName, role, isActive } = req.body;
  const currentUser = req.user;

  if (currentUser.role !== 'tenant_admin' && currentUser.userId !== userId) {
    return res.status(403).json({ success:false, message:'Forbidden' });
  }

  await db.query(
    `UPDATE users SET
      full_name = COALESCE($1, full_name),
      role = COALESCE($2, role),
      is_active = COALESCE($3, is_active)
     WHERE id=$4 AND tenant_id=$5`,
    [fullName, role, isActive, userId, currentUser.tenantId]
  );

  res.json({ success:true, message:'User updated' });
};


exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const { userId: currentUserId, tenantId } = req.user;

  if (userId === currentUserId) {
    return res.status(403).json({ success:false, message:'Cannot delete yourself' });
  }

  await db.query(
    'DELETE FROM users WHERE id=$1 AND tenant_id=$2',
    [userId, tenantId]
  );

  res.json({ success:true, message:'User deleted' });
};



