(function (Backbone, Compiler) {

	var Tree = Backbone.Model.extend({
		/**
		 * @property {Object} root - Note the NULL root node of this tree.
		 */
		root: null,

		/**
		 * @property {Object} cur - Note the EMPTY current node of the tree we're building.
		 */
		cur: null,

		initialize: function() {
			this.cur = {};
		},

		/**
		 * Add a node: kind in {branch, leaf}.
		 *
		 * @param {String} name
		 * @param {String} kind
		 */
		addNode: function(name, kind) {

			// Construct the node object.
			var node = {
				name: name,
				children: [],
				parent: {}
			};

			// Check to see if it needs to be the root node.
			if((this.root == null) || (!this.root))
			{
				// We are the root node.
				this.root = node;
			}
			else
			{
				// We are the children.
				// Make our parent the CURrent node...
				node.parent = this.cur;

				// ... and add ourselves (via the unfortunately-named
				// "push" function) to the children array of the current node.
				this.cur.children.push(node);
			}

			// If we are an interior/branch node, then...
			if (kind == Tree.BRANCH_NODE)
			{
				// ... update the CURrent node pointer to ourselves.
				this.cur = node;
			}
		},

		/**
		 * Note that we're done with this branch of the tree...
		 */
		endChildren: function() {
			// ... by moving "up" to our parent node (if possible).
			if ((this.cur.parent !== null) && (this.cur.parent.name !== undefined))
			{
				this.cur = this.cur.parent;
			}
			else
			{
				// TODO: Some sort of error logging.
				// This really should not happen, but it will, of course.
			}
		},

		/**
		 * Return a string representation of the tree.
		 */
		toString: function() {
			// Initialize the result string.
			var traversalResult = "";

			// Recursive function to handle the expansion of the nodes.
			function expand(node, depth)
			{
				// Space out based on the current depth so
				// this looks at least a little tree-like.
				for (var i = 0; i < depth; i++)
				{
					traversalResult += "-";
				}

				// If there are no children (i.e., leaf nodes)...
				if (!node.children || node.children.length === 0)
				{
					// ... note the leaf node.
					traversalResult += "[" + node.name + "]";
					traversalResult += "\n";
				}
				else
				{
					// There are children, so note these interior/branch nodes and ...
					traversalResult += "<" + node.name + "> \n";

					// .. recursively expand them.
					for (var i = 0; i < node.children.length; i++)
					{
						expand(node.children[i], depth + 1);
					}
				}
			}

			// Make the initial call to expand from the root.
			expand(this.root, 0);

			// Return the result.
			return traversalResult;
		}
	}, {
		/**
		 * Note type constants
		 */
		BRANCH_NODE: 'branch',
		LEAF_NODE: 'leaf'
	});

	Compiler.Tree = Tree;

})(Backbone, Compiler);