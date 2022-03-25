/*
 * A forest is a collection of trees.
 */

class Forest {
	constructor() {
		this.#trees = [];
	}

	#trees;

	get trees() {
		return this.#trees;
	}

	get roots() {
		return this.#trees;
	}

	/**
	 * Returns a forest with this single tree in it.
	 * @return {Forest<IId>}
	 */
	static fromTree(tree) {
		const forest = new Forest();
		forest.appendTree(tree);
		return forest;
	}

	/**
	 * Returns all the nodes in this forest.
	 * That is, all the nodes in all the trees of all levels.
	 * @return {any[]}
	 */
	get nodes() {
		let coll = [];
		this.trees.forEach((tree) => {
			coll = coll.concat(tree.nodes);
		});
		return coll;
	}

	/**
	 * Creates a forest from the given roots.
	 * @param roots {TreeNode<any>[]}
	 * @return {Forest}
	 */
	static fromRoots(roots) {
		const Tree = require("./tree");
		const forest = new Forest();
		if (_.isNil(roots) || roots.length === 0) {
			return forest;
		}

		const trees = roots.filter((r) => !_.isNil(r)).map((root) => new Tree(root));
		trees.forEach((tree) => forest.appendTree(tree));
		return forest;
	}

	childIdExists(id) {
		return !_.isNil(this.findById(id));
	}

	hasChild(node) {
		return !_.isNil(this.findById(node.value.id));
	}

	find(predicate) {
		for (let i = 0; i < this.trees.length; i++) {
			const tree = this.trees[i];
			const found = tree.find(predicate);
			if (!_.isNil(found)) {
				return found;
			}
		}
		return null;
	}

	findById(id) {
		for (let i = 0; i < this.trees.length; i++) {
			const found = this.trees[i].findById(id);
			if (!_.isNil(found)) {
				return found;
			}
		}
		return null;
	}

	/**
	 * Fetches the leaf nodes of this forest.
	 */
	getLeafNodes() {
		let coll = [];
		this.#trees.forEach((tree) => {
			coll = coll.concat(tree.getLeadNodes());
		});
		return coll;
	}

	appendTree(tree) {
		const found = this.#trees.find((t) => t.root.value.id === tree.root.value.id);
		if (!_.isNil(found)) {
			throw new Error("The forrest already contains this tree.");
		}
		this.#trees.push(tree);
	}

	dft(visitor) {
		this.roots.forEach((r) => {
			r.dft(visitor);
		});
	}

	toJSON() {
		return this.trees.map((tree) => tree.toJSON());
	}
}

module.exports = Forest;
