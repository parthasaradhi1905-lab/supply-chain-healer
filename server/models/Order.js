import { getDb } from '../db/init.js';

/**
 * Order Model
 */
class Order {
  static findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT 
                    orders.*,
                    users.company_name as buyer_company,
                    suppliers.name as supplier_name,
                    (SELECT id FROM shipments WHERE order_id = orders.id ORDER BY id DESC LIMIT 1) as shipment_id
                 FROM orders
                 JOIN users ON orders.buyer_id = users.id
                 JOIN suppliers ON orders.primary_supplier_id = suppliers.id
                 WHERE orders.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static findByBuyer(buyerId) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT 
                    orders.*,
                    suppliers.name as supplier_name,
                    suppliers.location as supplier_location,
                    (SELECT id FROM shipments WHERE order_id = orders.id ORDER BY id DESC LIMIT 1) as shipment_id
                 FROM orders
                 JOIN suppliers ON orders.primary_supplier_id = suppliers.id
                 WHERE orders.buyer_id = ?
                 ORDER BY orders.created_at DESC`,
        [buyerId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Create a new order
   */
  static create({ buyer_id, supplier_id, product_name, quantity, unit_price, total_cost, expected_delivery }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO orders (buyer_id, primary_supplier_id, product_name, quantity, unit_price, total_cost, status, expected_delivery)
         VALUES (?, ?, ?, ?, ?, ?, 'pending_invoice', ?)`,
        [buyer_id, supplier_id, product_name, quantity, unit_price, total_cost, expected_delivery],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, success: true });
        }
      );
    });
  }

  static updateStatus(orderId, newStatus) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        [newStatus, orderId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT 
                    orders.*,
                    users.company_name as buyer_company,
                    suppliers.name as supplier_name,
                    suppliers.location as supplier_location,
                    (SELECT id FROM shipments WHERE order_id = orders.id ORDER BY id DESC LIMIT 1) as shipment_id
                 FROM orders
                 JOIN users ON orders.buyer_id = users.id
                 JOIN suppliers ON orders.primary_supplier_id = suppliers.id
                 ORDER BY orders.created_at DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }
}

export default Order;
