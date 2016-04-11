/**
 * Classed used to represent the scope table.
 */

(function (Backbone, Compiler) {

	var ScopeTable = Backbone.Model.extend({
		/**
		 * @property {Compiler.SymbolTableEntry[]} entries - List of symbol entries
		 */
		entries: null,

		/**
		 * @property {Int} nextEntryIndex - Next available symbol entry index
		 */
		nextEntryIndex: 0,

		/**
		 * @property {Int} scopeLevel - Current scope level
		 */
		scopeLevel: -1,

		/**
		 * @property {Int} parentScope - Parent scope level
		 */
		parentScope: null,

		/**
		 * @property {Array} childScopes - List of child scopes
		 */
		childScopes: null
	});

	Compiler.ScopeTable = ScopeTable;

})(Backbone, Compiler);
