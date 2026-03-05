class MetricsCollector:
    def __init__(self):
        self.recovery_time = []
        self.supply_loss = []
        self.cost = []

    def record(self, recovery, loss, cost):
        self.recovery_time.append(recovery)
        self.supply_loss.append(loss)
        self.cost.append(cost)

    def summary(self):
        return {
            "avg_recovery_time": sum(self.recovery_time) / max(1, len(self.recovery_time)),
            "avg_supply_loss": sum(self.supply_loss) / max(1, len(self.supply_loss)),
            "avg_cost": sum(self.cost) / max(1, len(self.cost))
        }
