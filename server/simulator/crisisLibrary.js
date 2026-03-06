const crisisLibrary = {
    suez_blockage: {
        type: "route_blockage",
        location: "Suez Canal",
        severity: 0.95,
        affected_routes: ["Asia-Europe"]
    },
    taiwan_chip_shortage: {
        type: "supplier_failure",
        location: "Taiwan",
        severity: 0.9,
        component: "microcontrollers"
    },
    panama_drought: {
        type: "capacity_reduction",
        location: "Panama Canal",
        severity: 0.7
    },
    rotterdam_strike: {
        type: "port_shutdown",
        location: "Rotterdam",
        severity: 0.85
    }
};

module.exports = crisisLibrary;
