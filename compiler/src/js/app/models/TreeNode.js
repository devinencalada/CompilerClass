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

		initialize: function() {
			this.children = [];
			this.parent = {};
		}
	});

	Compiler.TreeNode = TreeNode;

})(Backbone, Compiler);