import express from "express";
import pool from "../db.js";
import { authenticateToken, requireRole } from "../auth.js";

const router = express.Router();

// Helper to determine status from percentage
export function getWaterStatus(percent) {
  const p = Number(percent);
  if (p <= 0) return "Empty";
  if (p < 10) return "Very Critical";
  if (p < 25) return "Critical";
  if (p <= 50) return "Low";
  return "Normal";
}

// 1. GET /api/water-tanks - List all active water tanks with latest metrics
router.get("/water-tanks", async (req, res) => {
  try {
    const [tanks] = await pool.query(`
      SELECT 
        id, name, village_location, tank_type, total_capacity,
        current_quantity, current_level_percent, status,
        last_measured_at, measurement_method, sensor_id,
        tank_shape, dim_height, dim_diameter, dim_length, dim_width,
        source_id, is_active, created_at, updated_at
      FROM water_tanks
      WHERE is_active = 1
      ORDER BY name ASC
    `);

    // Add freshness check
    const now = Date.now();
    const enriched = tanks.map(t => {
      const lastTime = t.last_measured_at ? new Date(t.last_measured_at).getTime() : 0;
      const isOutdated = !t.last_measured_at || (now - lastTime > 24 * 60 * 60 * 1000);
      return {
        ...t,
        current_level_percent: Number(t.current_level_percent),
        is_outdated: isOutdated,
        freshness_label: isOutdated ? "Pending fresh measurement (>24h)" : "Live / Verified"
      };
    });

    res.json({ success: true, tanks: enriched });
  } catch (err) {
    console.error("GET /api/water-tanks error:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve water tanks" });
  }
});

// 2. GET /api/water-tanks/summary - Dashboard summary statistics
router.get("/water-tanks/summary", async (req, res) => {
  try {
    const [tanks] = await pool.query(`
      SELECT id, total_capacity, current_quantity, current_level_percent, status
      FROM water_tanks
      WHERE is_active = 1
    `);

    const totalTanks = tanks.length;
    const totalCapacity = tanks.reduce((acc, t) => acc + Number(t.total_capacity || 0), 0);
    const totalCurrentStorage = tanks.reduce((acc, t) => acc + Number(t.current_quantity || 0), 0);
    
    // Exact overall percentage: (Total Current Storage / Total Capacity) * 100
    const overallStoragePercent = totalCapacity > 0 
      ? Number(((totalCurrentStorage / totalCapacity) * 100).toFixed(2)) 
      : 0;

    const normalCount = tanks.filter(t => t.status === "Normal").length;
    const lowCount = tanks.filter(t => t.status === "Low").length;
    const criticalCount = tanks.filter(t => t.status === "Critical" || t.status === "Very Critical").length;
    const emptyCount = tanks.filter(t => t.status === "Empty").length;

    // Active unacknowledged alerts
    const [alertRows] = await pool.query(`
      SELECT COUNT(*) as count FROM water_level_alerts WHERE is_acknowledged = 0
    `);
    const activeAlertsCount = alertRows[0]?.count || 0;

    res.json({
      success: true,
      summary: {
        totalTanks,
        totalCapacity,
        totalCurrentStorage,
        overallStoragePercent,
        normalCount,
        lowCount,
        criticalCount,
        emptyCount,
        lowOrCriticalCount: lowCount + criticalCount + emptyCount,
        overallStatus: getWaterStatus(overallStoragePercent),
        activeAlertsCount
      }
    });
  } catch (err) {
    console.error("GET /api/water-tanks/summary error:", err);
    res.status(500).json({ success: false, message: "Failed to load water monitoring summary" });
  }
});

// 3. GET /api/water-tanks/alerts - List alerts (Admin only)
router.get("/water-tanks/alerts", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { acknowledged } = req.query;
    let query = `
      SELECT a.*, t.name as tank_name, t.village_location, t.tank_type
      FROM water_level_alerts a
      JOIN water_tanks t ON a.tank_id = t.id
    `;
    const params = [];
    if (acknowledged !== undefined && acknowledged !== "") {
      query += ` WHERE a.is_acknowledged = ?`;
      params.push(Number(acknowledged));
    }
    query += ` ORDER BY a.created_at DESC LIMIT 50`;

    const [alerts] = await pool.query(query, params);
    res.json({ success: true, alerts });
  } catch (err) {
    console.error("GET /api/water-tanks/alerts error:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve water level alerts" });
  }
});

// 4. PUT /api/water-tanks/alerts/:id/ack - Acknowledge alert (Admin only)
router.put("/water-tanks/alerts/:id/ack", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const alertId = req.params.id;
    const adminUser = req.user.loginId || req.user.fullName || "admin";

    const [result] = await pool.query(`
      UPDATE water_level_alerts
      SET is_acknowledged = 1, acknowledged_by = ?, acknowledged_at = NOW()
      WHERE id = ?
    `, [adminUser, alertId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, message: "Alert acknowledged successfully" });
  } catch (err) {
    console.error("PUT /api/water-tanks/alerts/:id/ack error:", err);
    res.status(500).json({ success: false, message: "Failed to acknowledge alert" });
  }
});

// 5. GET /api/water-tanks/:id - Single tank details with recent readings
router.get("/water-tanks/:id", async (req, res) => {
  try {
    const [tanks] = await pool.query(`
      SELECT * FROM water_tanks WHERE id = ?
    `, [req.params.id]);

    if (tanks.length === 0) {
      return res.status(404).json({ success: false, message: "Water tank not found" });
    }

    const [readings] = await pool.query(`
      SELECT * FROM water_level_readings
      WHERE tank_id = ?
      ORDER BY recorded_at DESC
      LIMIT 10
    `, [req.params.id]);

    res.json({ success: true, tank: tanks[0], recentReadings: readings });
  } catch (err) {
    console.error("GET /api/water-tanks/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve tank details" });
  }
});

// 6. POST /api/water-tanks - Add a new water tank (Admin only)
router.post("/water-tanks", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const name = req.body.name;
    const village_location = req.body.village_location || req.body.location;
    const tank_type = req.body.tank_type || req.body.type || "Overhead Tank";
    const total_capacity = req.body.total_capacity || req.body.capacity_litres || req.body.capacity;
    const tank_shape = req.body.tank_shape || req.body.shape || "Direct Quantity";
    const dim_height = req.body.dim_height;
    const dim_diameter = req.body.dim_diameter;
    const dim_length = req.body.dim_length;
    const dim_width = req.body.dim_width;
    const source_id = req.body.source_id;
    const initial_quantity = req.body.initial_quantity !== undefined ? req.body.initial_quantity : req.body.current_water_level_litres;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tank name is required" });
    }
    if (!village_location || !village_location.trim()) {
      return res.status(400).json({ success: false, message: "Village location is required" });
    }
    const capacity = Number(total_capacity);
    if (!capacity || capacity <= 0) {
      return res.status(400).json({ success: false, message: "Total storage capacity must be a positive number of litres" });
    }

    let currentQty = 0;
    if (initial_quantity !== undefined && initial_quantity !== null && initial_quantity !== "") {
      const q = Number(initial_quantity);
      if (q < 0 || q > capacity) {
        return res.status(400).json({
          success: false,
          message: `Initial water quantity (${q} L) must be between 0 and total capacity (${capacity} L)`
        });
      }
      currentQty = q;
    }

    const percent = capacity > 0 ? Number(((currentQty / capacity) * 100).toFixed(2)) : 0;
    const status = getWaterStatus(percent);
    const tankId = `TNK-${Date.now().toString().slice(-6)}`;

    await pool.query(`
      INSERT INTO water_tanks (
        id, name, village_location, tank_type, total_capacity,
        current_quantity, current_level_percent, status,
        last_measured_at, measurement_method, tank_shape,
        dim_height, dim_diameter, dim_length, dim_width, source_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Manual', ?, ?, ?, ?, ?, ?)
    `, [
      tankId, name.trim(), village_location.trim(), tank_type, capacity,
      currentQty, percent, status, tank_shape,
      dim_height ? Number(dim_height) : null,
      dim_diameter ? Number(dim_diameter) : null,
      dim_length ? Number(dim_length) : null,
      dim_width ? Number(dim_width) : null,
      source_id || null
    ]);

    // Initial reading entry
    const readingId = `RDG-${Date.now().toString().slice(-6)}`;
    await pool.query(`
      INSERT INTO water_level_readings (
        id, tank_id, measured_quantity, percentage, measurement_method, recorded_by, notes, recorded_at
      ) VALUES (?, ?, ?, ?, 'Manual', ?, 'Initial calibrated baseline reading', NOW())
    `, [readingId, tankId, currentQty, percent, req.user.loginId || "admin"]);

    res.status(201).json({
      success: true,
      message: "Water tank created and registered successfully in MySQL",
      tankId,
      tank: {
        id: tankId,
        name: name.trim(),
        village_location: village_location.trim(),
        tank_type,
        total_capacity: capacity,
        current_quantity: currentQty,
        current_level_percent: percent,
        status
      }
    });
  } catch (err) {
    console.error("POST /api/water-tanks error:", err);
    res.status(500).json({ success: false, message: "Failed to create water tank: " + err.message });
  }
});

// 7. PUT /api/water-tanks/:id - Update tank configuration (Admin only)
router.put("/water-tanks/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const tankId = req.params.id;
    const [existing] = await pool.query("SELECT * FROM water_tanks WHERE id = ?", [tankId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Tank not found" });
    }

    const currentTank = existing[0];
    const {
      name,
      village_location,
      tank_type,
      total_capacity,
      tank_shape,
      dim_height,
      dim_diameter,
      dim_length,
      dim_width,
      source_id,
      is_active
    } = req.body;

    const newCap = total_capacity !== undefined ? Number(total_capacity) : currentTank.total_capacity;
    if (newCap <= 0) {
      return res.status(400).json({ success: false, message: "Total capacity must be greater than 0" });
    }
    if (currentTank.current_quantity > newCap) {
      return res.status(400).json({
        success: false,
        message: `New capacity (${newCap} L) cannot be less than current measured water (${currentTank.current_quantity} L)`
      });
    }

    const newPercent = Number(((currentTank.current_quantity / newCap) * 100).toFixed(2));
    const newStatus = getWaterStatus(newPercent);

    await pool.query(`
      UPDATE water_tanks SET
        name = COALESCE(?, name),
        village_location = COALESCE(?, village_location),
        tank_type = COALESCE(?, tank_type),
        total_capacity = ?,
        current_level_percent = ?,
        status = ?,
        tank_shape = COALESCE(?, tank_shape),
        dim_height = ?,
        dim_diameter = ?,
        dim_length = ?,
        dim_width = ?,
        source_id = ?,
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `, [
      name !== undefined ? name.trim() : null,
      village_location !== undefined ? village_location.trim() : null,
      tank_type || null,
      newCap,
      newPercent,
      newStatus,
      tank_shape || null,
      dim_height !== undefined ? Number(dim_height) : currentTank.dim_height,
      dim_diameter !== undefined ? Number(dim_diameter) : currentTank.dim_diameter,
      dim_length !== undefined ? Number(dim_length) : currentTank.dim_length,
      dim_width !== undefined ? Number(dim_width) : currentTank.dim_width,
      source_id !== undefined ? source_id : currentTank.source_id,
      is_active !== undefined ? Number(is_active) : currentTank.is_active,
      tankId
    ]);

    res.json({ success: true, message: "Tank details updated successfully" });
  } catch (err) {
    console.error("PUT /api/water-tanks/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to update tank" });
  }
});

// 8. DELETE /api/water-tanks/:id - Delete water tank (Admin only)
router.delete("/water-tanks/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const tankId = req.params.id;
    const [existing] = await pool.query("SELECT * FROM water_tanks WHERE id = ?", [tankId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Tank not found" });
    }

    // Delete associated readings and tank
    await pool.query("DELETE FROM water_level_readings WHERE tank_id = ?", [tankId]);
    await pool.query("DELETE FROM water_level_alerts WHERE tank_id = ?", [tankId]);
    await pool.query("DELETE FROM water_distribution_records WHERE tank_id = ?", [tankId]);
    await pool.query("DELETE FROM water_tanks WHERE id = ?", [tankId]);

    res.json({ success: true, message: `Tank ${existing[0].name} deleted successfully` });
  } catch (err) {
    console.error("DELETE /api/water-tanks/:id error:", err);
    res.status(500).json({ success: false, message: "Failed to delete water tank" });
  }
});

// 9. POST /api/water-tanks/:id/readings - Record new water level measurement (Admin only)
router.post("/water-tanks/:id/readings", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const tankId = req.params.id;
    const [tanks] = await pool.query("SELECT * FROM water_tanks WHERE id = ?", [tankId]);
    if (tanks.length === 0) {
      return res.status(404).json({ success: false, message: "Water tank not found" });
    }

    const tank = tanks[0];
    let { measuredQuantity, waterHeight, measurementMethod = "Manual", notes = "" } = req.body;

    // Check if measurementMethod is valid
    if (measurementMethod !== "Manual" && measurementMethod !== "Sensor") {
      measurementMethod = "Manual";
    }

    // Volume computation if water height is supplied and quantity is not directly given
    let calculatedFromHeight = false;
    let heightVal = null;
    if ((measuredQuantity === undefined || measuredQuantity === null || measuredQuantity === "") && waterHeight !== undefined && waterHeight !== null) {
      heightVal = Number(waterHeight);
      if (isNaN(heightVal) || heightVal < 0) {
        return res.status(400).json({ success: false, message: "Water height reading cannot be negative" });
      }
      if (tank.dim_height && heightVal > Number(tank.dim_height)) {
        return res.status(400).json({
          success: false,
          message: `Water height (${heightVal}m) exceeds configured tank height (${tank.dim_height}m)`
        });
      }

      if (tank.tank_shape === "Cylindrical Vertical" && tank.dim_diameter) {
        const radius = Number(tank.dim_diameter) / 2;
        const volumeM3 = Math.PI * Math.pow(radius, 2) * heightVal;
        measuredQuantity = Math.round(volumeM3 * 1000); // 1 m^3 = 1000 L
        calculatedFromHeight = true;
      } else if (tank.tank_shape === "Rectangular Box" && tank.dim_length && tank.dim_width) {
        const volumeM3 = Number(tank.dim_length) * Number(tank.dim_width) * heightVal;
        measuredQuantity = Math.round(volumeM3 * 1000);
        calculatedFromHeight = true;
      } else if (tank.dim_height) {
        measuredQuantity = Math.round((heightVal / Number(tank.dim_height)) * Number(tank.total_capacity));
        calculatedFromHeight = true;
      } else {
        return res.status(400).json({
          success: false,
          message: "Tank dimensions are not configured to calculate volume from height. Please enter water quantity in litres directly."
        });
      }
    } else {
      measuredQuantity = Number(measuredQuantity);
    }

    // Exact strict validation
    if (isNaN(measuredQuantity)) {
      return res.status(400).json({ success: false, message: "A valid measured water quantity in litres is required" });
    }
    if (measuredQuantity < 0) {
      return res.status(400).json({ success: false, message: "Water quantity cannot be negative" });
    }
    if (measuredQuantity > Number(tank.total_capacity)) {
      return res.status(400).json({
        success: false,
        message: `Water quantity (${measuredQuantity.toLocaleString()} L) cannot exceed the total tank capacity (${Number(tank.total_capacity).toLocaleString()} L)`
      });
    }

    // Water level percentage calculation
    const percentage = Number(((measuredQuantity / Number(tank.total_capacity)) * 100).toFixed(2));
    const status = getWaterStatus(percentage);
    const recorder = req.user.loginId || req.user.fullName || "admin";
    const readingId = `RDG-${Date.now().toString().slice(-6)}`;

    // 1. Insert new reading into history
    await pool.query(`
      INSERT INTO water_level_readings (
        id, tank_id, measured_quantity, percentage, measurement_method,
        water_height_m, recorded_by, notes, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      readingId,
      tankId,
      measuredQuantity,
      percentage,
      measurementMethod,
      heightVal,
      recorder,
      notes ? notes.trim() : (calculatedFromHeight ? `Calculated from ${heightVal}m height sensor` : "Routine water level measurement")
    ]);

    // 2. Update tank current readings
    await pool.query(`
      UPDATE water_tanks SET
        current_quantity = ?,
        current_level_percent = ?,
        status = ?,
        last_measured_at = NOW(),
        measurement_method = ?
      WHERE id = ?
    `, [measuredQuantity, percentage, status, measurementMethod, tankId]);

    // 3. Keep linked water_sources table in sync if linked
    if (tank.source_id) {
      await pool.query(`
        UPDATE water_sources SET
          current_level_percent = ?,
          last_inspected = CONCAT('Updated Today ', DATE_FORMAT(NOW(), '%h:%i %p'))
        WHERE id = ?
      `, [Math.round(percentage), tank.source_id]);
    }

    // 4. Trigger alert if below threshold (<= 50%)
    if (percentage <= 50) {
      const alertId = `ALT-${Date.now().toString().slice(-6)}`;
      const alertMsg = `Tank '${tank.name}' level reached ${percentage}% (${measuredQuantity.toLocaleString()} L) - Threshold: ${status}`;
      await pool.query(`
        INSERT INTO water_level_alerts (id, tank_id, alert_type, percentage, message, is_acknowledged, created_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
      `, [alertId, tankId, status === "Normal" ? "Low" : status, percentage, alertMsg]);
    }

    res.status(201).json({
      success: true,
      message: `Measurement of ${measuredQuantity.toLocaleString()} L (${percentage}%) recorded successfully in MySQL`,
      reading: {
        id: readingId,
        tankId,
        tankName: tank.name,
        measuredQuantity,
        percentage,
        status,
        measurementMethod,
        waterHeight: heightVal,
        recordedBy: recorder,
        recordedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("POST /api/water-tanks/:id/readings error:", err);
    res.status(500).json({ success: false, message: "Failed to record water measurement: " + err.message });
  }
});

// 10. GET /api/water-tanks/:id/readings - Historical readings with optional date range
router.get("/water-tanks/:id/readings", async (req, res) => {
  try {
    const tankId = req.params.id;
    const { from, to, limit = 50 } = req.query;

    let query = `
      SELECT r.*, t.name as tank_name, t.total_capacity
      FROM water_level_readings r
      JOIN water_tanks t ON r.tank_id = t.id
      WHERE r.tank_id = ?
    `;
    const params = [tankId];

    if (from) {
      query += ` AND DATE(r.recorded_at) >= ?`;
      params.push(from);
    }
    if (to) {
      query += ` AND DATE(r.recorded_at) <= ?`;
      params.push(to);
    }

    query += ` ORDER BY r.recorded_at DESC LIMIT ?`;
    params.push(Math.min(200, Math.max(1, Number(limit) || 50)));

    const [readings] = await pool.query(query, params);

    res.json({
      success: true,
      readings: readings.map(r => ({
        ...r,
        percentage: Number(r.percentage)
      }))
    });
  } catch (err) {
    console.error("GET /api/water-tanks/:id/readings error:", err);
    res.status(500).json({ success: false, message: "Failed to load measurement history" });
  }
});

// 11. GET /api/water-distribution - List supply and consumption records
router.get("/water-distribution", async (req, res) => {
  try {
    const { tankId, from, to } = req.query;
    let query = `
      SELECT d.*, t.name as tank_name, t.total_capacity
      FROM water_distribution_records d
      LEFT JOIN water_tanks t ON d.tank_id = t.id
      WHERE 1=1
    `;
    const params = [];
    if (tankId) {
      query += ` AND d.tank_id = ?`;
      params.push(tankId);
    }
    if (from) {
      query += ` AND d.distribution_date >= ?`;
      params.push(from);
    }
    if (to) {
      query += ` AND d.distribution_date <= ?`;
      params.push(to);
    }
    query += ` ORDER BY d.distribution_date DESC, d.created_at DESC LIMIT 50`;

    const [records] = await pool.query(query, params);
    res.json({ success: true, distributionRecords: records });
  } catch (err) {
    console.error("GET /api/water-distribution error:", err);
    res.status(500).json({ success: false, message: "Failed to retrieve water distribution records" });
  }
});

// 12. POST /api/water-distribution - Record water supply / consumption (Admin only)
router.post("/water-distribution", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const {
      tank_id,
      target_area,
      distribution_date,
      quantity_supplied,
      duration_hours = 2.0,
      inflow_litres = 0,
      outflow_litres = 0,
      notes = ""
    } = req.body;

    if (!target_area || !target_area.trim()) {
      return res.status(400).json({ success: false, message: "Target village area/ward is required" });
    }
    const supplied = Number(quantity_supplied);
    if (isNaN(supplied) || supplied < 0) {
      return res.status(400).json({ success: false, message: "Quantity supplied cannot be negative" });
    }

    const distId = `DIST-${Date.now().toString().slice(-6)}`;
    const distDate = distribution_date || new Date().toISOString().split("T")[0];
    const recorder = req.user.loginId || "admin";

    await pool.query(`
      INSERT INTO water_distribution_records (
        id, tank_id, target_area, distribution_date, quantity_supplied,
        duration_hours, inflow_litres, outflow_litres, recorded_by, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      distId,
      tank_id || null,
      target_area.trim(),
      distDate,
      supplied,
      Number(duration_hours) || 2.0,
      Number(inflow_litres) || 0,
      Number(outflow_litres) || supplied,
      recorder,
      notes ? notes.trim() : null
    ]);

    res.status(201).json({
      success: true,
      message: "Water supply distribution record logged successfully",
      recordId: distId
    });
  } catch (err) {
    console.error("POST /api/water-distribution error:", err);
    res.status(500).json({ success: false, message: "Failed to record water distribution: " + err.message });
  }
});

// 13. GET /api/water-distribution/estimate/:tankId - Calculate estimated days remaining
router.get("/water-distribution/estimate/:tankId", async (req, res) => {
  try {
    const tankId = req.params.tankId;
    const [tanks] = await pool.query("SELECT * FROM water_tanks WHERE id = ?", [tankId]);
    if (tanks.length === 0) {
      return res.status(404).json({ success: false, message: "Tank not found" });
    }
    const tank = tanks[0];

    // Check consumption records
    const [records] = await pool.query(`
      SELECT quantity_supplied, outflow_litres, distribution_date
      FROM water_distribution_records
      WHERE tank_id = ?
      ORDER BY distribution_date DESC
      LIMIT 14
    `, [tankId]);

    if (records.length === 0) {
      return res.json({
        success: true,
        hasSufficientData: false,
        message: "No historical distribution records available for this tank. Cannot estimate depletion date accurately.",
        tank: {
          id: tank.id,
          name: tank.name,
          currentQuantity: tank.current_quantity,
          capacity: tank.total_capacity
        }
      });
    }

    const totalOutflow = records.reduce((acc, r) => acc + (Number(r.outflow_litres) || Number(r.quantity_supplied) || 0), 0);
    const avgDailyOutflow = Math.round(totalOutflow / records.length);

    let daysRemaining = null;
    let estimatedDepletionDate = null;

    if (avgDailyOutflow > 0 && tank.current_quantity > 0) {
      daysRemaining = Number((tank.current_quantity / avgDailyOutflow).toFixed(1));
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.floor(daysRemaining));
      estimatedDepletionDate = targetDate.toISOString().split("T")[0];
    }

    res.json({
      success: true,
      hasSufficientData: true,
      isEstimate: true,
      estimateLabel: "Estimated Projection based on recorded consumption history (Not a direct sensor reading)",
      avgDailyOutflowLitres: avgDailyOutflow,
      recordsAnalyzedCount: records.length,
      currentStorageLitres: tank.current_quantity,
      estimatedDaysRemaining: daysRemaining,
      estimatedDepletionDate,
      tank: {
        id: tank.id,
        name: tank.name,
        currentQuantity: tank.current_quantity,
        capacity: tank.total_capacity
      }
    });
  } catch (err) {
    console.error("GET /api/water-distribution/estimate/:tankId error:", err);
    res.status(500).json({ success: false, message: "Failed to calculate consumption estimate" });
  }
});

export default router;
