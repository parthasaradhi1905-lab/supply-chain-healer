from probability_model import propagate_failure

class CascadeEngine:
    def __init__(self, graph):
        self.graph = graph

    def run_cascade(self, start_node):
        failed = set([start_node])
        queue = [start_node]

        while queue:
            node = queue.pop(0)
            if node not in self.graph:
                # Node isolated or not in graph
                continue

            for neighbor in self.graph.neighbors(node):
                # Using 0.4 as failure propagation probability limit 
                prob = 0.4
                if propagate_failure(prob):
                    if neighbor not in failed:
                        failed.add(neighbor)
                        queue.append(neighbor)

        return failed
