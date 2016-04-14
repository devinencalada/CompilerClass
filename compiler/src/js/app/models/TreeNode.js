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
		 * @property {Compiler.TreeNode} parent
		 */
		parent: null,

		/**
		 * @property {String} type
		 */
		type: null,

		/**
		 * @property {String} leftSiblingType
		 */
		leftSiblingType: null,

		/**
		 * @property {String} rightSiblingType
		 */
		rightSiblingType: null,

		/**
		 * @property {Compiler.TreeNode[]} children
		 */
		children: null,

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

		/**
		 * Sets this nodes sibling node type.
		 *
		 * @param {String} typeFromChild
		 */
		setSiblingType: function(siblingType) {
			if(!this.leftSiblingType)
			{
				this.leftSiblingType = siblingType;
			}
			else if(!this.rightSiblingType)
			{
				this.rightSiblingType = siblingType;
			}
			else
			{
				var errorMessage = 'Error! Attempt was made to synthesize a type to a parent with its left and right types already set.';
				Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS);
				throw errorMessage;
			}
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