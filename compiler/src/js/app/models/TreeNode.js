/**
 * Classed used to represent nodes of the AST and CST
 */

(function (Backbone, Compiler) {

	var TreeNode = Backbone.Model.extend({
		/**
		 * @property {String} name - Node name
		 */
		name: null,

		/**
		 * @property {Compiler.Token} token
		 */
		token: null,

		/**
		 * @property {Compiler.TreeNode[]} children
		 */
		children: null,

		/**
		 * @property {Compiler.TreeNode} parent
		 */
		parent: null,

		/**
		 * @property {String} kind - "Branch or Leaf"
		 */
		kind: null,

		/**
		 * @property {Compiler.SymbolTableEntry} symbolTableEntry
		 */
		symbolTableEntry: null,

		initialize: function() {
			this.children = [];
			this.parent = {};
		},

		/**
		 * Determine whether this is a leaf node.
		 *
		 * @returns {boolean}
		 */
		isLeaf: function() {
			return this.kind == Compiler.TreeNode.LEAF_NODE;
		},

		/**
		 * Determine whether this is a branch node.
		 *
		 * @returns {boolean}
		 */
		isBranch: function() {
			return this.kind == Compiler.TreeNode.BRANCH_NODE;
		},

		setSynthesizedType: function() {

		}
	}, {

		/**
		 * Note type constants
		 */
		BRANCH_NODE: 'branch',
		LEAF_NODE: 'leaf',

		/**
		 * Static method used to create TreeNode instances
		 */
		createNode: function(name, token, kind) {
			var treeNode = new TreeNode();

			if(arguments.length == 2)
			{
				treeNode.name = name;
				treeNode.token = null;
				treeNode.kind = token;
			}
			else
			{
				treeNode.name = name;
				treeNode.token = token;
				treeNode.kind = kind;
			}

			return treeNode;
		}
	});

	Compiler.TreeNode = TreeNode;

})(Backbone, Compiler);