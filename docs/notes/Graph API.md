The graph API

### Creating a Graph

```js
const g = new Graph();
```

You can pass initial data in the `Graph` constructor. If it's a string it will be interpreted as the name of the graph. If it's an object it will be assigned to the graph:

```js
g = new Graph("My graph");
g.name; // my graph

g = new Graph({name: "My graph", description: "Just a test."});
```

Arbitrary attributes can be passed to the graph in this way but they won't automatically get serialized unless they are predefined like `description` or `name`.

### Adding nodes

Nodes can be added via the `addNode` method and if you pass a string it will be interpreted as the id of the node:

```js
g = new Graph();
n = g.addNode("a")
n.id // a
```

If nothing is specified a unique identifier will be assigned to the node

```js
g = new Graph();
n = g.addNode();
n.id // soemthing like '4a5a2b10-aef6-48b7-9735-37dd64f103fc'
```

A node really is a simple plain object and only a few attributes are defined:

- id: the unique identifier of the node
- name: the name or title
- typeName: something which can be used to identify the node when used in a knowledge graph (Entities).

Out of this only the `id` and `typeName` are required and automatically assigned if not specified. The default `typeName` is 'Unknown' and the `id` is by default a globally unique identifier.

```js
g = new Graph();
n = g.addNode({
    size: 23,
    color: "red"
})
n.id// ade54a06-5165-4e23-8073-4865f970e087
n.name// undefined
n.typeName// Unknown
```

Because nodes are plain objects they don't require serialization. The main disadvantage is the lack of graph-specific methods on the node. If you need e.g. the degree of a node you need to go via the graph:

```js
g = new Graph();
n = g.addNode("a");
g.getDegree("a") // 0
```

In the same philosophy, you can't navigate from a node to its parent graph or siblings. You can detect ownerships for instance via

```js
const g = new Graph();
n = g.addNode("a")
g.nodeIdExists("a") // true
```

If you supply two parameters to the `addNode` method it will be interpreted as `id` and `name` of the node.

```js
const g = new Graph();
n = g.addNode("a", "A")
n.id // a
n.name // A
```

Note that an `id` is a string and whatever is supplied is converted via `toString` internally.

### Adding edges

There are many ways to add an edge to a graph, the most obvious one is via node references:

```js
g = new Graph();
a = g.addNode("a");
b = g.addNode("b");
edge = g.addEdge(a, b);
```

or via the node id's:

```js
g = new Graph();
a = g.addNode("a");
b = g.addNode("b");
edge = g.addEdge("a", "b");
```
