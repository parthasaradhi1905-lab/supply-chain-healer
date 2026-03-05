import { getDb } from '../db/init.js';

/**
 * Shipment Model - Track order shipments
 */
class Shipment {
    /**
     * Create a new shipment for an order
     */
    static create({ order_id, supplier_id, route, transport_mode, eta, current_location }) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const departure_date = new Date().toISOString().split('T')[0];

            db.run(
                `INSERT INTO shipments (order_id, supplier_id, route, transport_mode, status, current_location, departure_date, eta, tracking_updates)
                 VALUES (?, ?, ?, ?, 'in_transit', ?, ?, ?, ?)`,
                [order_id, supplier_id, route, transport_mode, current_location || 'Origin Warehouse', departure_date, eta, JSON.stringify([
                    { time: new Date().toISOString(), status: 'Order Confirmed', location: 'Origin Warehouse' }
                ])],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, success: true });
                }
            );
        });
    }

    /**
     * Get all shipments
     */
    static getAll() {
        return new Promise((resolve, reject) => {
            const db = getDb();
            db.all(
                `SELECT 
                    shipments.*,
                    orders.product_name,
                    orders.quantity,
                    suppliers.name as supplier_name,
                    suppliers.location as supplier_location
                 FROM shipments
                 LEFT JOIN orders ON shipments.order_id = orders.id
                 LEFT JOIN suppliers ON shipments.supplier_id = suppliers.id
                 ORDER BY shipments.created_at DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    /**
     * Get shipment by order ID
     */
    static findByOrderId(orderId) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            db.get(
                `SELECT 
                    shipments.*,
                    orders.product_name,
                    orders.quantity,
                    orders.expected_delivery,
                    suppliers.name as supplier_name,
                    suppliers.location as supplier_location
                 FROM shipments
                 LEFT JOIN orders ON shipments.order_id = orders.id
                 LEFT JOIN suppliers ON shipments.supplier_id = suppliers.id
                 WHERE shipments.order_id = ?`,
                [orderId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Update shipment status
     */
    static updateStatus(shipmentId, status, location) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            db.run(
                `UPDATE shipments SET status = ?, current_location = ? WHERE id = ?`,
                [status, location, shipmentId],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.changes > 0);
                }
            );
        });
    }

    /**
     * Add tracking update
     */
    static addTrackingUpdate(shipmentId, status, location) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const update = { time: new Date().toISOString(), status, location };

            db.get('SELECT tracking_updates FROM shipments WHERE id = ?', [shipmentId], (err, row) => {
                if (err) return reject(err);

                let updates = [];
                try {
                    updates = JSON.parse(row?.tracking_updates || '[]');
                } catch (e) {
                    updates = [];
                }
                updates.push(update);

                db.run(
                    `UPDATE shipments SET tracking_updates = ?, current_location = ? WHERE id = ?`,
                    [JSON.stringify(updates), location, shipmentId],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.changes > 0);
                    }
                );
            });
        });
    }
}

export default Shipment;
