import express from 'express';
import bcrypt from 'bcrypt';
import Supplier from '../models/Supplier.js';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import Disruption from '../models/Disruption.js';
import RecoveryPlan from '../models/RecoveryPlan.js';
import Invoice from '../models/Invoice.js';
import { getDb } from '../db/init.js';

const router = express.Router();

// ========================================
// AUTHENTICATION ROUTES
// ========================================

/**
 * POST /api/auth/login
 * Authenticate user with username, password, and role
 */
router.post('/auth/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }

        const db = getDb();

        const user = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM users WHERE username = ? AND role = ?`,
                [username, role],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user data (excluding password)
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                company_name: user.company_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/auth/register', async (req, res) => {
    try {
        const { username, password, role, company_name, email } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required' });
        }

        if (!['buyer', 'supplier', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be buyer, supplier, or admin' });
        }

        const db = getDb();

        // Check if username+role combo already exists
        const existingUser = await new Promise((resolve, reject) => {
            db.get(`SELECT id FROM users WHERE username = ? AND role = ?`, [username, role], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existingUser) {
            return res.status(409).json({ error: `Username already registered as ${role}` });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO users (username, password_hash, role, company_name, email) VALUES (?, ?, ?, ?, ?)`,
                [username, passwordHash, role, company_name || '', email || ''],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: result.id,
                username,
                role,
                company_name: company_name || '',
                email: email || ''
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// SUPPLIER ROUTES
// ========================================

/**
 * GET /api/suppliers/alternatives
 * Query alternative suppliers with 100% quantity constraint
 * Query params: quantity (required), exclude (optional comma-separated IDs)
 */
router.get('/suppliers/alternatives', (req, res) => {
    try {
        const { quantity, exclude } = req.query;

        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ error: 'Invalid quantity parameter' });
        }

        const requiredQuantity = parseInt(quantity);
        const excludeIds = exclude ? exclude.split(',').map(id => parseInt(id)) : [];

        const suppliers = Supplier.findAlternatives(requiredQuantity, excludeIds);

        res.json({
            success: true,
            requiredQuantity,
            foundCount: suppliers.length,
            suppliers
        });
    } catch (error) {
        console.error('Error finding alternatives:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/suppliers/:id
 */
router.get('/suppliers/:id', (req, res) => {
    try {
        const supplier = Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ success: true, supplier });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/suppliers
 * Get all alternative suppliers
 */
router.get('/suppliers', async (req, res) => {
    try {
        const suppliers = await Supplier.getAll();
        res.json({ success: true, count: suppliers.length, suppliers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// ORDER ROUTES
// ========================================

/**
 * GET /api/orders
 */
router.get('/orders', async (req, res) => {
    try {
        const { buyer_id } = req.query;

        const orders = buyer_id
            ? await Order.findByBuyer(parseInt(buyer_id))
            : await Order.getAll();

        res.json({ success: true, count: orders.length, orders });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/orders
 * Create a new order and auto-create a shipment
 */
router.post('/orders', async (req, res) => {
    try {
        const { supplier_id, product_name, quantity, unit_price, total_cost, expected_delivery } = req.body;

        // Default buyer_id to 1 (ACME) for demo purposes
        const buyer_id = req.body.buyer_id || 1;

        if (!supplier_id || !product_name || !quantity) {
            return res.status(400).json({ error: 'Missing required fields: supplier_id, product_name, quantity' });
        }

        // Get supplier info for route
        const supplier = await Supplier.findById(supplier_id);
        const supplierLocation = supplier?.location || 'Origin';

        const orderResult = await Order.create({
            buyer_id,
            supplier_id,
            product_name,
            quantity,
            unit_price: unit_price || 0,
            total_cost: total_cost || 0,
            expected_delivery: expected_delivery || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

        res.status(201).json({ success: true, orderId: orderResult.id, message: 'Order created successfully. Waiting for invoice.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/orders/:id
 */
router.get('/orders/:id', (req, res) => {
    try {
        const order = Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/orders/:id/status
 * Body: { status: 'at_risk' | 'recovered' | 'completed' }
 */
router.patch('/orders/:id/status', async (req, res) => {
    try {
        console.log(`[PATCH] Updating status for order ${req.params.id} to ${req.body.status}`);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const updated = await Order.updateStatus(req.params.id, status);

        if (!updated) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// INVOICE ROUTES
// ========================================

/**
 * GET /api/invoices
 * Get invoices (filtered by role and id)
 */
router.get('/invoices', async (req, res) => {
    try {
        const { role, id } = req.query;
        if (!role || !id) return res.status(400).json({ error: 'Role and ID required' });

        const invoices = await Invoice.findByRole(role, parseInt(id));
        res.json({ success: true, count: invoices.length, invoices });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/invoices/order/:orderId
 * Get invoice for a specific order
 */
router.get('/invoices/order/:orderId', async (req, res) => {
    try {
        const invoice = await Invoice.findByOrderId(req.params.orderId);
        if (!invoice) return res.json({ success: false, message: 'No invoice found' });
        res.json({ success: true, invoice });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/invoices
 * Create a new invoice
 */
router.post('/invoices', async (req, res) => {
    try {
        const result = await Invoice.create(req.body);
        res.status(201).json({ success: true, invoiceId: result.id, message: 'Invoice created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/invoices/:id/approve
 * Buyer approves invoice -> Order Active -> Shipment Created
 */
router.patch('/invoices/:id/approve', async (req, res) => {
    try {
        // 1. Update Invoice Status
        await Invoice.updateStatus(req.params.id, 'approved');

        // 2. Get details
        const invoice = await Invoice.findById(req.params.id);

        // 3. Activate Order (invoice paid)
        await Order.updateStatus(invoice.order_id, 'active');

        // 4. Create Shipment (only if one doesn't already exist for this order)
        const existingShipments = await Shipment.getAll();
        const hasShipment = existingShipments.some(s => s.order_id === invoice.order_id);

        if (!hasShipment) {
            const supplier = await Supplier.findById(invoice.supplier_id);
            const supplierLocation = supplier?.location || 'Origin';
            const route = `${supplierLocation} → Los Angeles, USA`;

            await Shipment.create({
                order_id: invoice.order_id,
                supplier_id: invoice.supplier_id,
                route,
                transport_mode: 'sea',
                eta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                current_location: supplierLocation
            });
        }

        res.json({ success: true, message: 'Invoice approved. Order and Shipment active.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/invoices/:id/reject
 * Buyer rejects invoice
 */
router.patch('/invoices/:id/reject', async (req, res) => {
    try {
        const { reason } = req.body;
        await Invoice.updateStatus(req.params.id, 'rejected', reason);
        res.json({ success: true, message: 'Invoice rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// SHIPMENT ROUTES
// ========================================

/**
 * GET /api/shipments
 * Get all shipments
 */
router.get('/shipments', async (req, res) => {
    try {
        const shipments = await Shipment.getAll();
        res.json({ success: true, count: shipments.length, shipments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/shipments/order/:orderId
 * Get shipment by order ID
 */
router.get('/shipments/order/:orderId', async (req, res) => {
    try {
        const shipment = await Shipment.findByOrderId(req.params.orderId);
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        res.json({ success: true, shipment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// DISRUPTION ROUTES
// ========================================

/**
 * POST /api/disruptions
 * Body: { type, title, severity, affected_routes[], affected_transport_modes[], impact_description }
 */
// POST /api/disruptions
router.post('/disruptions', async (req, res) => {
    try {
        const db = getDb();
        const disruptionId = await Disruption.create(req.body);
        const disruption = await Disruption.findById(disruptionId);

        // Auto-sync: Update affected orders and shipments
        let affectedRoutes = [];
        try {
            affectedRoutes = JSON.parse(req.body.affected_routes || '[]');
        } catch (e) {
            if (typeof req.body.affected_routes === 'string') {
                affectedRoutes = [req.body.affected_routes];
            }
        }

        // Update shipments matching affected routes
        if (affectedRoutes.length > 0) {
            const routeConditions = affectedRoutes.map(r => `route LIKE '%${r}%'`).join(' OR ');
            await new Promise((resolve, reject) => {
                db.run(`UPDATE shipments SET status = 'delayed' WHERE (${routeConditions}) AND status != 'delivered'`, function (err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });

            // Update orders with delayed shipments
            await new Promise((resolve, reject) => {
                db.run(`
                    UPDATE orders SET status = 'at_risk' 
                    WHERE id IN (SELECT order_id FROM shipments WHERE status = 'delayed')
                    AND status NOT IN ('completed', 'cancelled', 'recovered')
                `, function (err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
        }

        res.status(201).json({
            success: true,
            message: 'Disruption created and synced to affected orders',
            disruption
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/disruptions/active
 */
router.get('/disruptions/active', async (req, res) => {
    try {
        const disruptions = await Disruption.getActive();
        res.json({ success: true, count: disruptions.length, disruptions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/disruptions/:id/resolve
 */
router.post('/disruptions/:id/resolve', (req, res) => {
    try {
        const resolved = Disruption.resolve(req.params.id);

        if (!resolved) {
            return res.status(404).json({ error: 'Disruption not found' });
        }

        res.json({ success: true, message: 'Disruption resolved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/disruptions/:id/sync
 * Sync a disruption to related orders and shipments
 * Updates order status to 'at_risk' and shipment status to 'delayed'
 */
router.post('/disruptions/:id/sync', async (req, res) => {
    try {
        const db = getDb();
        const disruptionId = req.params.id;

        // Get the disruption
        const disruption = await new Promise((resolve, reject) => {
            db.get(`SELECT * FROM disruptions WHERE id = ?`, [disruptionId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!disruption) {
            return res.status(404).json({ error: 'Disruption not found' });
        }

        // Parse affected routes
        let affectedRoutes = [];
        try {
            affectedRoutes = JSON.parse(disruption.affected_routes || '[]');
        } catch (e) {
            affectedRoutes = [disruption.affected_routes];
        }

        // Find and update shipments that match affected routes
        const updatedShipments = await new Promise((resolve, reject) => {
            const routeConditions = affectedRoutes.map(r => `route LIKE '%${r}%'`).join(' OR ');
            const query = routeConditions
                ? `UPDATE shipments SET status = 'delayed' WHERE (${routeConditions}) AND status != 'delivered'`
                : `UPDATE shipments SET status = 'delayed' WHERE status = 'in_transit'`;

            db.run(query, function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        // Find and update orders related to delayed shipments
        const updatedOrders = await new Promise((resolve, reject) => {
            db.run(`
                UPDATE orders SET status = 'at_risk' 
                WHERE id IN (
                    SELECT order_id FROM shipments WHERE status = 'delayed'
                ) AND status NOT IN ('completed', 'cancelled', 'recovered')
            `, function (err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        res.json({
            success: true,
            message: 'Disruption synced to orders and shipments',
            updatedShipments,
            updatedOrders,
            disruptionId
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// RECOVERY PLAN ROUTES
// ========================================

/**
 * POST /api/recovery-plans
 * Body: { order_id, disruption_id, alternative_supplier_id, plan_label, ... }
 */
router.post('/recovery-plans', (req, res) => {
    try {
        const planId = RecoveryPlan.create(req.body);
        const plan = RecoveryPlan.findById(planId);

        res.status(201).json({
            success: true,
            message: 'Recovery plan created',
            plan
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recovery-plans
 * Query params: order_id (optional)
 */
router.get('/recovery-plans', (req, res) => {
    try {
        const { order_id } = req.query;

        if (!order_id) {
            return res.status(400).json({ error: 'order_id is required' });
        }

        const plans = RecoveryPlan.findByOrder(parseInt(order_id));
        res.json({ success: true, count: plans.length, plans });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/recovery-plans/:id/status
 * Body: { status: 'accepted' | 'rejected' | 'executed', rejection_reason?: string }
 */
router.patch('/recovery-plans/:id/status', (req, res) => {
    try {
        const { status, rejection_reason } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const updated = RecoveryPlan.updateStatus(req.params.id, status, rejection_reason);

        if (!updated) {
            return res.status(404).json({ error: 'Recovery plan not found' });
        }

        res.json({ success: true, message: 'Recovery plan status updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// AI AGENT ROUTES
// ========================================

import AgentOrchestrator from '../ai/AgentOrchestrator.js';

/**
 * GET /api/disruptions/active
 * Get all active disruptions for real-time supplier alerts
 */
router.get('/disruptions/active', async (req, res) => {
    try {
        const disruptions = await new Promise((resolve, reject) => {
            const db = getDb();

            db.all(
                `SELECT * FROM disruptions WHERE is_active = 1 ORDER BY created_at DESC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });

        res.json({
            success: true,
            count: disruptions.length,
            disruptions: disruptions.map(d => ({
                id: d.id,
                type: d.type,
                severity: d.severity,
                title: d.title,
                description: d.description,
                created_at: d.created_at,
            })),
        });
    } catch (error) {
        console.error('Error fetching active disruptions:', error);
        res.json({ success: true, count: 0, disruptions: [] }); // Gracefully return empty on error
    }
});

/**
 * POST /api/ai/run-pipeline
 * Run the complete 4-stage self-healing pipeline
 * Body: { orderId?: number } - optional order ID, defaults to first pending order
 */
router.post('/ai/run-pipeline', async (req, res) => {
    try {
        const { orderId } = req.body;

        const result = await AgentOrchestrator.runFullPipeline(orderId);

        res.json(result);
    } catch (error) {
        console.error('Error running pipeline:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/trigger-crisis
 * Body: { disruptionType: 'suez_blockage'|'hurricane'|'labor_strike', orderId: number }
 */
router.post('/ai/trigger-crisis', async (req, res) => {
    try {
        const { disruptionType, orderId } = req.body;

        if (!disruptionType || !orderId) {
            return res.status(400).json({ error: 'disruptionType and orderId are required' });
        }

        const result = await AgentOrchestrator.executeCrisisResponse(disruptionType, orderId);

        res.json(result);
    } catch (error) {
        console.error('Error triggering crisis:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/reject-plan
 * Body: { planId: number, reason: string, orderId: number }
 */
router.post('/ai/reject-plan', async (req, res) => {
    try {
        const { planId, reason, orderId } = req.body;

        if (!planId || !reason || !orderId) {
            return res.status(400).json({ error: 'planId, reason, and orderId are required' });
        }

        // Update plan status to rejected
        RecoveryPlan.updateStatus(planId, 'rejected', reason);

        // Generate next alternative
        const result = await AgentOrchestrator.handlePlanRejection(planId, reason, orderId);

        res.json(result);
    } catch (error) {
        console.error('Error handling plan rejection:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/accept-plan
 * Body: { planId: number, orderId: number }
 */
router.post('/api/ai/accept-plan', (req, res) => {
    try {
        const { planId, orderId } = req.body;

        if (!planId || !orderId) {
            return res.status(400).json({ error: 'planId and orderId are required' });
        }

        // Update plan status to accepted
        RecoveryPlan.updateStatus(planId, 'accepted');

        // Update order status to recovered
        Order.updateStatus(orderId, 'recovered');

        res.json({
            success: true,
            message: 'Plan accepted and order status updated to recovered',
        });
    } catch (error) {
        console.error('Error accepting plan:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
