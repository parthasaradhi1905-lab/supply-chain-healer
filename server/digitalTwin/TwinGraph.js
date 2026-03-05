/**
 * TwinGraph — Digital Twin Graph Model
 * G = (V, E) representation of the supply chain network
 * 
 * Node types: supplier, port, factory, warehouse, retailer
 * Edge types: shipment_route, inventory_transfer
 */

import Supplier from '../models/Supplier.js';

class TwinGraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    addNode(type, id, data) {
        const existing = this.nodes.find(n => n.id === id && n.type === type);
        if (!existing) {
            this.nodes.push({ type, id, ...data });
        }
    }

    addEdge(source, target, data = {}) {
        this.edges.push({ source, target, ...data });
    }

    getNode(id) {
        return this.nodes.find(n => n.id === id);
    }

    /**
     * Build the graph from DB state + predefined infrastructure
     */
    buildFromDB() {
        this.nodes = [];
        this.edges = [];

        // --- Infrastructure nodes (ports, factories, warehouses, retailers) ---
        const infrastructure = [
            { type: 'port', id: 'port-shanghai', label: 'Port Shanghai', lat: 31.23, lng: 121.47, country: 'China' },
            { type: 'port', id: 'port-singapore', label: 'Port Singapore', lat: 1.26, lng: 103.84, country: 'Singapore' },
            { type: 'port', id: 'port-la', label: 'Port Los Angeles', lat: 33.74, lng: -118.27, country: 'USA' },
            { type: 'port', id: 'port-rotterdam', label: 'Port Rotterdam', lat: 51.95, lng: 4.14, country: 'Netherlands' },
            { type: 'port', id: 'port-dubai', label: 'Port Dubai', lat: 25.27, lng: 55.29, country: 'UAE' },
            { type: 'factory', id: 'factory-us', label: 'US Assembly Plant', lat: 34.05, lng: -118.24, country: 'USA' },
            { type: 'factory', id: 'factory-de', label: 'EU Assembly Plant', lat: 50.11, lng: 8.68, country: 'Germany' },
            { type: 'warehouse', id: 'wh-east', label: 'East Coast DC', lat: 40.71, lng: -74.01, country: 'USA' },
            { type: 'warehouse', id: 'wh-west', label: 'West Coast DC', lat: 37.77, lng: -122.42, country: 'USA' },
            { type: 'warehouse', id: 'wh-eu', label: 'EU Distribution Center', lat: 52.52, lng: 13.41, country: 'Germany' },
            { type: 'retailer', id: 'retailer-na', label: 'North America Retail', lat: 41.88, lng: -87.63, country: 'USA' },
            { type: 'retailer', id: 'retailer-eu', label: 'Europe Retail', lat: 48.86, lng: 2.35, country: 'France' },
        ];

        infrastructure.forEach(node => this.addNode(node.type, node.id, node));

        // --- Supplier nodes from DB ---
        try {
            const suppliers = Supplier.getAll();
            suppliers.forEach(s => {
                this.addNode('supplier', `supplier-${s.id}`, {
                    label: s.name,
                    country: s.country,
                    location: s.location,
                    reliability: s.reliability_score,
                    capacity: s.stock_capacity,
                    costPerUnit: s.cost_per_unit,
                    leadTime: s.lead_time_days,
                    specialty: s.specialty,
                    supplierType: s.type,
                });
            });
        } catch {
            // DB not available — add sample suppliers
            this.addNode('supplier', 'supplier-1', { label: 'SteelCorp Asia', country: 'China', reliability: 92 });
            this.addNode('supplier', 'supplier-2', { label: 'TechForge India', country: 'India', reliability: 85 });
            this.addNode('supplier', 'supplier-3', { label: 'Nordic Steel', country: 'Sweden', reliability: 88 });
        }

        // --- Edges (supply chain routes) ---
        const routes = [
            // Suppliers → Ports
            { source: 'supplier-1', target: 'port-shanghai', type: 'shipment_route', mode: 'road', cost: 2000, transitDays: 1 },
            { source: 'supplier-2', target: 'port-singapore', type: 'shipment_route', mode: 'road', cost: 1800, transitDays: 2 },
            { source: 'supplier-3', target: 'port-rotterdam', type: 'shipment_route', mode: 'rail', cost: 3000, transitDays: 3 },
            // Ports → Ports (ocean routes)
            { source: 'port-shanghai', target: 'port-la', type: 'shipment_route', mode: 'sea', cost: 12000, transitDays: 18, routeLabel: 'Trans-Pacific' },
            { source: 'port-shanghai', target: 'port-dubai', type: 'shipment_route', mode: 'sea', cost: 8000, transitDays: 12, routeLabel: 'Suez Canal' },
            { source: 'port-singapore', target: 'port-la', type: 'shipment_route', mode: 'sea', cost: 11000, transitDays: 20, routeLabel: 'Pacific Route' },
            { source: 'port-rotterdam', target: 'port-la', type: 'shipment_route', mode: 'sea', cost: 9000, transitDays: 14, routeLabel: 'Atlantic Route' },
            { source: 'port-dubai', target: 'port-rotterdam', type: 'shipment_route', mode: 'sea', cost: 7000, transitDays: 10, routeLabel: 'Mediterranean' },
            // Ports → Factories
            { source: 'port-la', target: 'factory-us', type: 'shipment_route', mode: 'road', cost: 1500, transitDays: 1 },
            { source: 'port-rotterdam', target: 'factory-de', type: 'shipment_route', mode: 'rail', cost: 2000, transitDays: 2 },
            // Factories → Warehouses
            { source: 'factory-us', target: 'wh-west', type: 'inventory_transfer', mode: 'road', cost: 800, transitDays: 1 },
            { source: 'factory-us', target: 'wh-east', type: 'inventory_transfer', mode: 'rail', cost: 2500, transitDays: 3 },
            { source: 'factory-de', target: 'wh-eu', type: 'inventory_transfer', mode: 'road', cost: 600, transitDays: 1 },
            // Warehouses → Retailers
            { source: 'wh-west', target: 'retailer-na', type: 'inventory_transfer', mode: 'road', cost: 500, transitDays: 2 },
            { source: 'wh-east', target: 'retailer-na', type: 'inventory_transfer', mode: 'road', cost: 400, transitDays: 1 },
            { source: 'wh-eu', target: 'retailer-eu', type: 'inventory_transfer', mode: 'road', cost: 350, transitDays: 1 },
        ];

        routes.forEach(r => this.addEdge(r.source, r.target, r));

        // Add edges for additional DB suppliers
        try {
            const suppliers = Supplier.getAll();
            suppliers.forEach(s => {
                if (s.id > 3) {
                    const nearestPort = s.country === 'China' ? 'port-shanghai'
                        : s.country === 'India' ? 'port-singapore'
                        : s.country === 'UAE' ? 'port-dubai'
                        : 'port-rotterdam';
                    this.addEdge(`supplier-${s.id}`, nearestPort, {
                        type: 'shipment_route',
                        mode: 'road',
                        cost: 2500,
                        transitDays: 2,
                    });
                }
            });
        } catch {
            // ignore
        }

        return this;
    }

    /**
     * Simulate a disruption on the graph — mark affected edges
     */
    simulateDisruption(affectedRoutes = [], severity = 'high') {
        const impactMultiplier = severity === 'critical' ? 3 : severity === 'high' ? 2 : 1.5;

        this.edges.forEach(edge => {
            const routeLabel = edge.routeLabel || '';
            const isAffected = affectedRoutes.some(r =>
                routeLabel.toLowerCase().includes(r.toLowerCase()) ||
                edge.source.toLowerCase().includes(r.toLowerCase()) ||
                edge.target.toLowerCase().includes(r.toLowerCase())
            );

            if (isAffected) {
                edge.disrupted = true;
                edge.originalCost = edge.cost;
                edge.originalTransitDays = edge.transitDays;
                edge.cost = Math.round(edge.cost * impactMultiplier);
                edge.transitDays = Math.round(edge.transitDays * impactMultiplier);
                edge.severity = severity;
            }
        });

        return this;
    }

    /**
     * Get the current state for API response
     */
    getState() {
        return {
            nodes: this.nodes,
            edges: this.edges,
            stats: {
                totalNodes: this.nodes.length,
                totalEdges: this.edges.length,
                suppliers: this.nodes.filter(n => n.type === 'supplier').length,
                ports: this.nodes.filter(n => n.type === 'port').length,
                factories: this.nodes.filter(n => n.type === 'factory').length,
                warehouses: this.nodes.filter(n => n.type === 'warehouse').length,
                retailers: this.nodes.filter(n => n.type === 'retailer').length,
                disruptedEdges: this.edges.filter(e => e.disrupted).length,
            },
        };
    }

    /**
     * Reset disruptions
     */
    reset() {
        this.edges.forEach(edge => {
            if (edge.disrupted) {
                edge.cost = edge.originalCost || edge.cost;
                edge.transitDays = edge.originalTransitDays || edge.transitDays;
                delete edge.disrupted;
                delete edge.severity;
                delete edge.originalCost;
                delete edge.originalTransitDays;
            }
        });
        return this;
    }
}

const twinGraph = new TwinGraph();
export default twinGraph;
