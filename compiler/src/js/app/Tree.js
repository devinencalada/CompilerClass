(function (Backbone, Compiler) {

	var Tree = Backbone.Model.extend({
		/**
		 * @property {Object} root - Note the NULL root node of this tree.
		 */
		root: null,

		/**
		 * @property {Object} cur - Note the EMPTY current node of the tree we're building.
		 */
		cur: {},

		/**
		 * Add a node: kind in {branch, leaf}.
		 *
		 * @param {String} name
		 * @param {String} kind
		 */
		addNode: function(name, kind) {

			console.log(name);

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
		 * CST Node constants
		 */
		BRANCH_NODE: 'branch',
		LEAF_NODE: 'leaf',
		PROGRAM_CST_NODE: 'Program',
		BLOCK_CST_NODE: 'Block',
		STATEMENT_LIST_CST_NODE: 'Statement List',
		STATEMENT_CST_NODE: 'Statement',
		PRINT_STATEMENT_CST_NODE: 'Print Statement',
		ASSIGNMENT_STATEMENT_CST_NODE: 'Assignment Statement',
		VAR_DECLARATION_CST_NODE: 'Variable Declaration',
		WHILE_STATEMENT_CST_NODE: 'While Statement',
		IF_STATEMENT_CST_NODE: 'If Statement',
		EXPRESSION_CST_NODE: 'Expression',
		INT_EXPRESSION_CST_NODE: 'Int Expression',
		STRING_EXPRESSION_CST_NODE: 'String Expression',
		BOOLEAN_EXPRESSION_CST_NODE: 'Boolean Expression',
		CHAR_LIST_CST_NODE: 'Char List',

		/**
		 * AST Node constants
		 */
		BLOCK_AST_NODE: 'BLOCK',
		VAR_DECLARATION_AST_NODE: 'Variable Declaration',
		ASSIGNMENT_STATEMENT_AST_NODE: 'Assignment Statement',
		PRINT_STATEMENT_AST_NODE: 'Print Statement',
		STRING_EXPRESSION_AST_NODE: 'String Expression',
		IF_STATEMENT_AST_NODE: 'If Statement',
		WHILE_STATEMENT_AST_NODE: 'While Statement',
		ADD_AST_NODE: 'Add',
		DIGIT_AST_NODE: 'Digit',
		EQUAL_AST_NODE: 'Equal',
		NOT_EQUAL_AST_NODE: 'Not Equal',
		BOOLEAN_EXPRESSION_AST_NODE: 'Boolean Expression'
	});

	Compiler.Tree = Tree;

})(Backbone, Compiler);