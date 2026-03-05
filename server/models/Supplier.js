import { getDb } from '../db/init.js';

/**
 * Supplier Model - Handles alternative supplier queries with 100% quantity constraint
 */
class Supplier {
  /**
   * Find alternative suppliers that can fulfill the ENTIRE required quantity
   * HARD CONSTRAINT: Only returns suppliers where stock_capacity >= requiredQuantity
   * 
   * @param {number} requiredQuantity - Minimum stock capacity required (100% of order)
   * @param {array} excludeIds - Supplier IDs to exclude (e.g., failed primary supplier)
   * @param {number} limit - Maximum number of alternatives to return
   * @returns {Promise<array>} Ranked suppliers that meet the quantity constraint
   */
  static findAlternatives(requiredQuantity, excludeIds = [], limit = 5) {
    return new Promise((resolve, reject) => {
      const db = getDb();

      // Build exclusion clause
      const exclusionClause = excludeIds.length > 0
        ? `AND id NOT IN (${excludeIds.join(',')})`
        : '';

      // CRITICAL: This query ONLY returns suppliers with stock_capacity >= requiredQuantity
      // The ranking formula weighs:
      //   - Cost (40%): Lower cost is better
      //   - Reliability (30%): Higher reliability is better
      //   - Lead Time (30%): Shorter lead time is better
      const query = `
            SELECT 
                *,
                (
                (cost_per_unit * 0.4) + 
                ((100 - reliability_score) * 0.3) + 
                (lead_time_days * 0.3)
                ) as ranking_score
            FROM suppliers 
            WHERE type = 'alternative' 
                AND stock_capacity >= ?
                ${exclusionClause}
            ORDER BY ranking_score ASC
            LIMIT ?
            `;

      db.all(query, [requiredQuantity, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get supplier by ID
   */
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get('SELECT * FROM suppliers WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  /**
   * Get all alternative suppliers (for admin view)
   */
  static getAllAlternatives() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all('SELECT * FROM suppliers WHERE type = "alternative" ORDER BY name', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Get all suppliers (primary + alternative)
   */
  static getAll() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all('SELECT * FROM suppliers ORDER BY type DESC, name', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * Verify if a supplier can fulfill a quantity (validation helper)
   */
  static async canFulfill(supplierId, requiredQuantity) {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return false;
    return supplier.stock_capacity >= requiredQuantity;
  }
}

export default Supplier;
