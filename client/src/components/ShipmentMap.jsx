import { MapPin, Navigation } from 'lucide-react';

export default function ShipmentMap({ shipments }) {
    if (!shipments || shipments.length === 0) {
        return (
            <div className="glass-card-light p-6 h-full flex items-center justify-center">
                <p className="text-text-muted">No active shipments</p>
            </div>
        );
    }

    return (
        <div className="glass-card-light p-6 space-y-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <Navigation className="w-5 h-5 text-accent-primary" />
                Active Shipments
            </h3>

            <div className="space-y-4">
                {shipments.map((shipment, index) => (
                    <div key={shipment.id || index} className="relative">
                        {/* Route Path */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <MapPin className="w-4 h-4 text-accent-success" />
                                <span>{shipment.route.split('→')[0].trim()}</span>
                            </div>
                            <div className="text-xs text-text-muted">
                                {shipment.transport_mode}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-text-secondary">
                                <span>{shipment.route.split('→')[1]?.trim() || 'Destination'}</span>
                                <MapPin className="w-4 h-4 text-accent-primary" />
                            </div>
                        </div>

                        {/* Progress Bar with Current Location */}
                        <div className="relative h-2 bg-bg-secondary rounded-full overflow-hidden">
                            <div
                                className="absolute h-full bg-gradient-to-r from-accent-success to-accent-primary transition-all duration-500"
                                style={{ width: `${calculateProgress(shipment)}%` }}
                            />

                            {/* Pulsing Dot for Current Location */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 pulse-dot"
                                style={{ left: `${calculateProgress(shipment)}%` }}
                            />
                        </div>

                        {/* Status and ETA */}
                        <div className="flex items-center justify-between mt-2">
                            <span className={`badge-${getStatusClass(shipment.status)}`}>
                                {shipment.status}
                            </span>
                            <span className="text-xs text-text-muted">
                                ETA: {formatETA(shipment.eta)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Helper functions
function calculateProgress(shipment) {
    // Simple estimation based on status
    const statusProgress = {
        'pending': 10,
        'in_transit': 65,
        'delayed': 50,
        'rerouted': 40,
        'delivered': 100,
    };
    return statusProgress[shipment.status] || 50;
}

function getStatusClass(status) {
    const statusMap = {
        'in_transit': 'info',
        'delayed': 'warning',
        'rerouted': 'warning',
        'delivered': 'active',
        'pending': 'info',
    };
    return statusMap[status] || 'info';
}

function formatETA(eta) {
    if (!eta) return 'N/A';
    const date = new Date(eta);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
