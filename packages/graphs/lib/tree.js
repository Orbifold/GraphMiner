/*
 * Defines a tree structure.
 * The payload of nodes need to have at least an id field.
 */
const utils = require("@graphminer/utils");

const _ = require("lodash");
const TreeNode = require("./treeNode");

class Tree {
	/**
	 * Instantiates a new tree.
	 * Pass optionally the root.
	 * @param root {any} Either a TreeNode or the payload of the root.
	 */
	constructor(root = null) {
		if (_.isNil(root)) {
			this._root = null;
		} else {
			if (root instanceof TreeNode) {
				this._root = root;
			} else {
				this._root = new TreeNode(root);
			}
		}
	}

	get root() {
		return this._root;
	}

	/**
	 * Sets the root of this tree.
	 * This will replace existing nodes in this tree.
	 * @param v
	 */
	set root(v) {
		this._root = v;
	}

	get isEmpty() {
		return _.isNil(this.root);
	}

	/**
	 * Returns all the nodes in this tree.
	 * @return {any[]}
	 */
	get nodes() {
		if (_.isNil(this.root)) {
			return [];
		}
		// cannot use an internal dictionary because child can be added outside the Tree via TreeNode.appendChild
		const coll = [];
		const collector = (n) => coll.push(n);
		this.dft(collector, this.root);
		return coll;
	}

	/**
	 * Returns whether the id is present anywhere in this tree.
	 * @param id
	 * @return {boolean}
	 */
	childIdExists(id) {
		return !_.isNil(this.findById(id));
	}

	/**
	 * Returns whether the given node is part of this tree.
	 * @param node
	 * @return {boolean}
	 */
	hasChild(node) {
		return !_.isNil(this.findById(node.value.id));
	}

	/**
	 * Fetches the leaf nodes of this tree.
	 */
	getLeadNodes() {
		const coll = [];
		const collector = (n) => {
			if (n.isLeaf) {
				coll.push(n);
			}
		};
		this.dft(collector, this.root);
		return coll;
	}

	/**
	 * Finds the node with the specified id.
	 * @param id
	 * @return {any[]}
	 */
	findById(id) {
		return this.find((n) => n.value.id === id);
	}

	/**
	 * Finds the node using the given predicate.
	 * The search is performed using a DFT.
	 * @param predicate
	 * @param startNode
	 * @return {any[]}
	 */
	find(predicate, startNode = null) {
		if (_.isNil(startNode)) {
			startNode = this.root;
		} else {
			const found = this.findById(startNode.value.id);
			if (_.isNil(found)) {
				throw new Error(`Specified start node with id '${startNode.value.id}' does not exist in the tree.`);
			}
		}
		return this.findTraverse(startNode, predicate);
	}

	/**
	 * Appends the given child to this node.
	 * @param value {any|TreeNode} Either a valud or a TreeNode.
	 * @param parentId {string} The parent id getting the new child.
	 */
	appendChild(value, parentId) {
		if (utils.isEmpty(parentId)) {
			this.root = new TreeNode(value);
			return this.root;
		}
		if (_.isNil(parentId)) {
			throw new Error("No parent supplied for the child.");
		}
		const parentNode = this.findById(parentId);
		if (_.isNil(parentNode)) {
			throw new Error(`Specified parent node with id '${parentId}' does not exist in the tree.`);
		}
		return parentNode.appendChild(value);
	}

	dft(visitor, startNode = null) {
		if (_.isNil(startNode)) {
			startNode = this.root;
		} else {
			const found = this.findById(startNode.value.id);
			if (_.isNil(found)) {
				throw new Error(`Specified start node with id '${startNode.value.id}' does not exist in the tree.`);
			}
		}
		// happens for empty tree
		if (_.isNil(startNode)) {
			return;
		}
		this.dftTraverse(startNode, visitor, 0);
	}

	findTraverse(node, predicate, level = 0) {
		if (predicate(node, level)) {
			return node;
		}
		if (node.children.length > 0) {
			for (let i = 0; i < node.children.length; i++) {
				let n = node.children[i];
				const found = this.findTraverse(n, predicate, level + 1);
				if (!_.isNil(found)) {
					return found;
				}
			}
		}
		return null;
	}

	dftTraverse(node, visitor, level = 0) {
		visitor(node, level);
		if (node.children.length > 0) {
			for (let i = 0; i < node.children.length; i++) {
				let n = node.children[i];
				this.dftTraverse(n, visitor, level + 1);
			}
		}
	}

	toJSON() {
		return this.root.toJSON();
	}
}

module.exports = Tree;
