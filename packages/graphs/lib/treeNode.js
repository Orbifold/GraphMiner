const _ = require("lodash");

/*
 * An item part of a {@link Tree}.
 */
class TreeNode {
	constructor(value, parentNode = null) {
		this.value = value;
		this.children = [];
		if (!_.isNil(parentNode)) {
			parentNode.appendChild(this);
		}
	}

	/**
	 * This node is a root if it has no parent.
	 */
	get isRoot() {
		return _.isNil(this.parent);
	}

	/**
	 * This node is a leaf if it has no children.
	 */
	get isLeaf() {
		return this.children.length === 0;
	}

	/**
	 * Appends the node or the new node created from the given data.
	 * The appended child is returned.
	 * @param child {any|TreeNode} The payload of the new node to add or the tree node.
	 * @return {TreeNode<IId> | TreeNode<any>}
	 */
	appendChild(child) {
		if (child instanceof TreeNode) {
			if (this.childIdExists(child.value.id)) {
				throw new Error(`Child with id '${child.value.id}' is already present.`);
			}
			if (!_.isNil(child.parent)) {
				child.parent.removeChild(child);
			}
			child.parent = this;
			this.children.push(child);
			return child;
		} else {
			if (this.childIdExists(child.id)) {
				throw new Error(`Child with id '${child.id}' is already present.`);
			}
			// note that we don't check whether the id is not elsewhere present in the tree or forest
			return new TreeNode(child, this);
		}
	}

	/**
	 * Removes the child from this node.
	 * @param child
	 * @return {TreeNode<IId> | TreeNode<D>}
	 */
	removeChild(child) {
		if (child instanceof TreeNode) {
			if (!this.childIdExists(child.value.id)) {
				return;
			}

			_.remove(this.children, (c) => c.value.id === child.value.id);
			child.parent = null;

			return child;
		} else {
			if (!this.childIdExists(child.id)) {
				return;
			}
			const node = this.getChild(child.id);
			this.removeChild(node);
			return node;
		}
	}

	childIdExists(id) {
		return this.children.filter((c) => c.value.id === id).length > 0;
	}

	hasChild(node) {
		if (_.isNil(node)) {
			throw new Error("Cannot test nil child.");
		}
		return !_.isNil(this.getChild(node.value.id));
	}

	getChild(id) {
		return this.children.find((c) => c.value.id === id);
	}

	toJSON() {
		// calls toJSON if present
		const json = JSON.parse(JSON.stringify(this.value));
		json.children = [];
		this.children.forEach((child) => json.children.push(child.toJSON()));
		return json;
	}
}

module.exports = TreeNode;
