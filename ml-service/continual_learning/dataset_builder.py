def build_dataset(events):
    dataset = []

    for e in events:
        # Check required keys exist before parsing to avoid key errors during testing
        if "risk_score" in e and "delay_days" in e and "affected_nodes" in e and "recovered" in e:
            row = {
                "risk_score": e["risk_score"],
                "delay": e["delay_days"],
                "nodes": len(e["affected_nodes"]),
                "success": 1.0 if e["recovered"] else 0.0
            }
            dataset.append(row)

    return dataset
