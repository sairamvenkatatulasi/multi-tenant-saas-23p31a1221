const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password, tenantSubdomain } = req.body;

  const tenant = await db.query(
    "SELECT * FROM tenants WHERE subdomain=$1",
    [tenantSubdomain]
  );

  if (!tenant.rows.length)
    return res.status(404).json({ success:false, message:"Tenant not found" });

  const user = await db.query(
    "SELECT * FROM users WHERE email=$1 AND tenant_id=$2",
    [email, tenant.rows[0].id]
  );

  if (!user.rows.length) return res.status(401).json({ success:false });

  const valid = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!valid) return res.status(401).json({ success:false });

  const token = jwt.sign(
    { userId:user.rows[0].id, tenantId:user.rows[0].tenant_id, role:user.rows[0].role },
    process.env.JWT_SECRET,
    { expiresIn:'24h' }
  );

  res.json({ success:true, token });
};
