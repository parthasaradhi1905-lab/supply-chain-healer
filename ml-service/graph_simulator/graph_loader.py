from neo4j import GraphDatabase
import networkx as nx

class GraphLoader:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def load_graph(self):
        G = nx.DiGraph()
        query = """
        MATCH (a)-[r]->(b)
        RETURN a.id AS source, b.id AS target, type(r) AS rel
        """
        try:
            with self.driver.session() as session:
                results = session.run(query)
                for record in results:
                    G.add_edge(
                        record["source"],
                        record["target"],
                        type=record["rel"]
                    )
        except Exception as e:
            print(f"GraphLoader Warning: Failed to connect or query neo4j - {e}. Returning empty graph.")
        return G
