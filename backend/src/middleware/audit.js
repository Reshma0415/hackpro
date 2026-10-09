import { run } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const logAudit = async ({
  actorId = null,
  actorRole = 'ANONYMOUS',
  actorEmail = null,
  action,
  targetType = null,
  targetId = null,
  ipAddress = '127.0.0.1',
  details = {}
}) => {
  try {
    const id = uuidv4();
    await run(
      `INSERT INTO audit_logs (id, actor_id, actor_role, actor_email, action, target_type, target_id, ip_address, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        actorId,
        actorRole,
        actorEmail,
        action,
        targetType,
        targetId,
        ipAddress,
        typeof details === 'object' ? JSON.stringify(details) : String(details)
      ]
    );
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
};

