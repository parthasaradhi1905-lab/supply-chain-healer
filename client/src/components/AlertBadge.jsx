import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

export default function AlertBadge({ severity, message }) {
    const getConfig = () => {
        switch (severity) {
            case 'critical':
                return {
                    className: 'badge-danger',
                    icon: AlertTriangle,
                    label: 'CRITICAL',
                };
            case 'high':
                return {
                    className: 'badge-danger',
                    icon: AlertTriangle,
                    label: 'HIGH',
                };
            case 'medium':
                return {
                    className: 'badge-warning',
                    icon: AlertCircle,
                    label: 'MEDIUM',
                };
            case 'low':
                return {
                    className: 'badge-info',
                    icon: Info,
                    label: 'LOW',
                };
            default:
                return {
                    className: 'badge-info',
                    icon: Info,
                    label: 'INFO',
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <div className="glass-card-light p-4 flex items-start gap-3">
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{
                color: severity === 'critical' || severity === 'high' ? '#ff3366' :
                    severity === 'medium' ? '#ffaa00' : '#00d9ff'
            }} />
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className={config.className}>{config.label}</span>
                </div>
                <p className="text-sm text-text-secondary">{message}</p>
            </div>
        </div>
    );
}
