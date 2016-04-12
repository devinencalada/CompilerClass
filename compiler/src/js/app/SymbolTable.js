/**
 * Classed used to represent the symbol table.
 */

(function (Backbone, Compiler) {

	var SymbolTable = Backbone.Model.extend({
		/**
		 * @property {Compiler.ScopeTable} defaultScopeTable
		 */
		defaultScopeTable: null,

		/**
		 * @property {Compiler.ScopeTable} currentScopeTable
		 */
		currentScopeTable: null,

		/**
		 * @property {Int} nextScopeNumber
		 */
		nextScopeNumber: 0,

		initialize: function() {
			this.defaultScopeTable = new Compiler.ScopeTable();
			this.currentScopeTable = this.defaultScopeTable;
		}
	});

	Compiler.SymbolTable = SymbolTable;

})(Backbone, Compiler);