Cypher is the Neo4j query language and is also an open standard (Open Cypher) implemented by diverse products (e.g. MemGraph).

GraphMiner uses something akin to Cypher to represent nodes, edges and graph structures in general. It's a simple language which makes it easy to define graphs and to serialize graphs. We call it pseudo-cypher and it essentially is Cypher without the query or filtering part.

For example, a node can be defined as

```text
(n:Car{speed: 120})
```

and an edge as

```text
(u)-[:knows]->(v)
```

and if you can turn it into a graph with

```js
g = Graph.fromPseudoCypher("(1)-[:linkedTo]->(2)")
```

which would result in a graph with two nodes having id equal to 1 and 2, linked with an edge having name 'linkedTo'. This is much easier but equivalent to the more explicit

```js
g = new Graph()
one = g.addNode("1")
two = g.addNode("2")
edge = g.addEdge(one, two, "linkedTo")
```

The pseudo-cypher format can be used for nodes and edges as well. For instance, all of the `addNode` calls below will create a new node and the parsed information will be assigned accordingly:

```js
g = new Graph()
g.addNode("(a)")
g.addNode("(c:Car)")
g.addNode("(c:Car{id:1442, speed:120})")
```

> Note the difference between `addNode("a")` and `addNode("(a)"). Without the parentheses "a" becomes the id of the new node while "(a)" is interpreted as pseudo-cypher and "a" becomes the name of the new node.

