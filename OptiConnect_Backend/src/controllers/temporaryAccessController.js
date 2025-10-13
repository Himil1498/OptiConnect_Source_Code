const { pool } = require('../config/database');

/**
 * Calculate human-readable time remaining
 * @param {number} seconds - Seconds remaining until expiration
 * @returns {object} Time remaining breakdown
 */
const calculateTimeRemaining = (seconds) => {
  if (!seconds || seconds <= 0) {
    return {
      expired: true,
      display: 'Expired',
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total_seconds: 0
    };
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  let display = '';
  if (days > 0) display += `${days}d `;
  if (hours > 0) display += `${hours}h `;
  if (minutes > 0) display += `${minutes}m `;
  if (secs > 0 && days === 0) display += `${secs}s`;

  return {
    expired: false,
    display: display.trim() || 'Just now',
    days,
    hours,
    minutes,
    seconds: secs,
    total_seconds: seconds
  };
};

/**
 * @route   GET /api/temporary-access
 * @desc    Get all temporary access grants (admin/manager)
 * @access  Private (Admin/Manager)
 */
const getAllTemporaryAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase(); // Case-insensitive role check

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only admin or manager can view temporary access'
      });
    }

    const { status, user_id } = req.query;

    let query = `
      SELECT ta.*,
             u.username,
             u.full_name,
             u.email,
             r.name as region_name,
             r.code as region_code,
             granter.username as granted_by_username,
             TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), ta.expires_at) as seconds_remaining
      FROM temporary_access ta
      INNER JOIN users u ON ta.user_id = u.id
      INNER JOIN regions r ON ta.resource_id = r.id
      INNER JOIN users granter ON ta.granted_by = granter.id
      WHERE ta.resource_type = 'region'
    `;
    const params = [];

    if (status) {
      if (status === 'active') {
        query += ' AND ta.revoked_at IS NULL AND ta.expires_at > UTC_TIMESTAMP()';
      } else if (status === 'revoked') {
        query += ' AND ta.revoked_at IS NOT NULL';
      } else if (status === 'expired') {
        query += ' AND ta.revoked_at IS NULL AND ta.expires_at <= UTC_TIMESTAMP()';
      }
    }

    if (user_id) {
      query += ' AND ta.user_id = ?';
      params.push(user_id);
    }

    query += ' ORDER BY ta.granted_at DESC';

    const [access] = await pool.query(query, params);

    // Add time remaining calculation
    const accessWithTimeRemaining = access.map(grant => ({
      ...grant,
      time_remaining: calculateTimeRemaining(grant.seconds_remaining)
    }));

    res.json({ success: true, access: accessWithTimeRemaining });
  } catch (error) {
    console.error('Get temporary access error:', error);
    res.status(500).json({ success: false, error: 'Failed to get temporary access' });
  }
};

/**
 * @route   POST /api/temporary-access
 * @desc    Grant temporary access to region (manager+)
 * @access  Private (Manager/Admin)
 */
const grantTemporaryAccess = async (req, res) => {
  try {
    const granterId = req.user.id;
    const granterRole = req.user.role?.toLowerCase(); // Case-insensitive role check

    if (granterRole !== 'admin' && granterRole !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only admin or manager can grant temporary access'
      });
    }

    const { user_id, region_name, access_level, expires_at, reason } = req.body;

    // Log the request body for debugging
    console.log('📨 Grant temporary access request:', {
      user_id,
      region_name,
      expires_at,
      access_level,
      reason
    });

    if (!user_id || !region_name || !expires_at) {
      console.log('❌ Validation failed:', {
        hasUserId: !!user_id,
        hasRegionName: !!region_name,
        hasExpiresAt: !!expires_at
      });
      return res.status(400).json({
        success: false,
        error: 'User ID, region name, and expires_at are required'
      });
    }

    // Verify user exists
    const [users] = await pool.query('SELECT id, full_name, email FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Find region by name
    const [regions] = await pool.query('SELECT id FROM regions WHERE name = ? AND is_active = true', [region_name]);
    if (regions.length === 0) {
      return res.status(404).json({ success: false, error: 'Region not found' });
    }

    const regionId = regions[0].id;

    // Check if user already has permanent access
    const [existingAccess] = await pool.query(
      'SELECT id FROM user_regions WHERE user_id = ? AND region_id = ?',
      [user_id, regionId]
    );

    if (existingAccess.length > 0) {
      console.log(`⚠️ User ${user_id} already has permanent access to region ${regionId}`);
      return res.status(400).json({
        success: false,
        error: 'User already has permanent access to this region. Remove permanent access first to grant temporary access.'
      });
    }

    // Check if active temporary access already exists
    const [existingTemp] = await pool.query(
      `SELECT id FROM temporary_access
       WHERE user_id = ? AND resource_type = 'region' AND resource_id = ?
       AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()`,
      [user_id, regionId]
    );

    if (existingTemp.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already has active temporary access to this region'
      });
    }

    // Log received expires_at for debugging
    console.log('🕐 Expires_at received from frontend:', expires_at);
    console.log('🕐 Current server time (local):', new Date());
    console.log('🕐 Current server time (UTC):', new Date().toISOString());

    // Convert to UTC for consistent storage
    const expiresDate = new Date(expires_at);
    const mysqlDateTime = expiresDate.toISOString().slice(0, 19).replace('T', ' ');

    console.log('🕐 MySQL datetime being stored (UTC):', mysqlDateTime);
    console.log('🕐 Difference from now (minutes):', Math.round((expiresDate - new Date()) / 60000));

    const [result] = await pool.query(
      `INSERT INTO temporary_access
       (user_id, resource_type, resource_id, access_level, reason, granted_by, expires_at)
       VALUES (?, 'region', ?, ?, ?, ?, ?)`,
      [
        user_id,
        regionId,
        access_level || 'read',
        reason,
        granterId,
        mysqlDateTime
      ]
    );

    console.log(`✅ Created temporary access grant ID: ${result.insertId}`);
    console.log(`   User: ${users[0].full_name} (${user_id})`);
    console.log(`   Region: ${region_name} (${regionId})`);
    console.log(`   Expires: ${expires_at}`);

    // Also add temporary access to user_regions table for actual region access
    // This allows the user to access the region in the map
    await pool.query(
      `INSERT INTO user_regions (user_id, region_id, access_level, assigned_by)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE access_level = ?, assigned_by = ?`,
      [user_id, regionId, access_level || 'read', granterId, access_level || 'read', granterId]
    );

    console.log(`✅ Added region access to user_regions table for temporary access`);

    res.status(201).json({
      success: true,
      grant: {
        id: result.insertId,
        user_id,
        user_name: users[0].full_name,
        user_email: users[0].email,
        region_name,
        resource_id: regionId,
        access_level: access_level || 'read',
        granted_at: new Date(),
        expires_at,
        reason,
        granted_by: granterId,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Grant temporary access error:', error);
    res.status(500).json({ success: false, error: 'Failed to grant temporary access' });
  }
};

/**
 * @route   DELETE /api/temporary-access/:id
 * @desc    Revoke temporary access (manager+)
 * @access  Private (Manager/Admin)
 */
const revokeTemporaryAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role?.toLowerCase(); // Case-insensitive role check

    if (userRole !== 'admin' && userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Only admin or manager can revoke temporary access'
      });
    }

    // Check if access exists
    const [access] = await pool.query(
      'SELECT id, revoked_at FROM temporary_access WHERE id = ?',
      [id]
    );

    if (access.length === 0) {
      return res.status(404).json({ success: false, error: 'Temporary access not found' });
    }

    if (access[0].revoked_at !== null) {
      return res.status(400).json({
        success: false,
        error: 'Access already revoked'
      });
    }

    // Get the grant details before revoking
    const [grantDetails] = await pool.query(
      'SELECT user_id, resource_id FROM temporary_access WHERE id = ?',
      [id]
    );

    await pool.query(
      'UPDATE temporary_access SET revoked_at = UTC_TIMESTAMP(), revoked_by = ? WHERE id = ?',
      [userId, id]
    );

    // Remove from user_regions table (only if no permanent access exists)
    if (grantDetails.length > 0) {
      const grantUserId = grantDetails[0].user_id;
      const grantResourceId = grantDetails[0].resource_id;

      // Check if there's any other active temporary access for this region
      const [otherTemp] = await pool.query(
        `SELECT id FROM temporary_access
         WHERE user_id = ? AND resource_id = ? AND id != ?
         AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP()`,
        [grantUserId, grantResourceId, id]
      );

      // If no other temporary access, remove from user_regions
      if (otherTemp.length === 0) {
        await pool.query(
          'DELETE FROM user_regions WHERE user_id = ? AND region_id = ? AND assigned_by = ?',
          [grantUserId, grantResourceId, userId]
        );
        console.log(`✅ Removed temporary region access from user_regions`);
      }
    }

    res.json({ success: true, message: 'Temporary access revoked successfully' });
  } catch (error) {
    console.error('Revoke temporary access error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke temporary access' });
  }
};

/**
 * @route   GET /api/temporary-access/my-access
 * @desc    Get current user's active temporary access
 * @access  Private
 */
const getMyTemporaryAccess = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT ta.*,
             r.name as region_name,
             r.code as region_code,
             r.type as region_type,
             granter.username as granted_by_username,
             granter.full_name as granted_by_name,
             TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), ta.expires_at) as seconds_remaining
      FROM temporary_access ta
      INNER JOIN regions r ON ta.resource_id = r.id
      INNER JOIN users granter ON ta.granted_by = granter.id
      WHERE ta.user_id = ?
        AND ta.resource_type = 'region'
        AND ta.revoked_at IS NULL
        AND ta.expires_at > UTC_TIMESTAMP()
      ORDER BY ta.expires_at ASC
    `;

    const [access] = await pool.query(query, [userId]);

    // Add time remaining calculation
    const accessWithTimeRemaining = access.map(grant => ({
      ...grant,
      time_remaining: calculateTimeRemaining(grant.seconds_remaining)
    }));

    res.json({
      success: true,
      access: accessWithTimeRemaining,
      count: accessWithTimeRemaining.length
    });
  } catch (error) {
    console.error('Get my temporary access error:', error);
    res.status(500).json({ success: false, error: 'Failed to get temporary access' });
  }
};

module.exports = {
  getAllTemporaryAccess,
  grantTemporaryAccess,
  revokeTemporaryAccess,
  getMyTemporaryAccess
};
