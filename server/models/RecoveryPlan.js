import { getDb } from '../db/init.js';

/**
 * RecoveryPlan Model
 */
class RecoveryPlan {
  static create(data) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO recovery_plans (
                    order_id, disruption_id, alternative_supplier_id, plan_label,
                    quantity, unit_price, total_cost, new_lead_time_days,
                    cost_increase_percent, time_increase_percent, status, ai_reasoning
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.order_id,
          data.disruption_id,
          data.alternative_supplier_id,
          data.plan_label,
          data.quantity,
          data.unit_price,
          data.total_cost,
          data.new_lead_time_days,
          data.cost_increase_percent,
          data.time_increase_percent,
          data.status || 'proposed',
          data.ai_reasoning || ''
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  static findByOrder(orderId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT 
                    recovery_plans.*,
                    suppliers.name as supplier_name,
                    suppliers.location as supplier_location,
                    suppliers.reliability_score
                 FROM recovery_plans
                 JOIN suppliers ON recovery_plans.alternative_supplier_id = suppliers.id
                 WHERE recovery_plans.order_id = ?
                 ORDER BY recovery_plans.created_at DESC`,
        [orderId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  static updateStatus(planId, newStatus, rejectionReason = null) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE recovery_plans 
                 SET status = ?, rejection_reason = ?, decided_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`,
        [newStatus, rejectionReason, planId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT 
                    recovery_plans.*,
                    suppliers.name as supplier_name,
                    suppliers.location as supplier_location
                 FROM recovery_plans
                 JOIN suppliers ON recovery_plans.alternative_supplier_id = suppliers.id
                 WHERE recovery_plans.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

export default RecoveryPlan;
