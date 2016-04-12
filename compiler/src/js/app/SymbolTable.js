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
		},

		/**
		 * Sets the current scope.
		 */
		openScope: function() {
			var scopeTable = new Compiler.ScopeTable({
				scope: this.nextScopeNumber++
			});

			scopeTable.parentScopeTable = this.currentScopeTable;

			this.currentScopeTable.addChildScopeTable(scopeTable);
			this.currentScopeTable = scopeTable;
		},

		/**
		 * Closes the current scope.
		 */
		closeScope: function() {
			if(this.currentScopeTable.parentScopeTable)
			{
				this.currentScopeTable = this.currentScopeTable.parentScopeTable;
			}
			else
			{
				var errorMessage = 'Error! Attempt was made to move to non existent parent scope.';
				Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SCOPE_TABLE);
				throw errorMessage;
			}
		},

		/**
		 * Adds an entry to the symbol table.
		 *
		 * @param {Compiler.SymbolTableEntry} symbolTableEntry
		 * @returns {Boolean}
		 */
		addEntry: function(symbolTableEntry) {
			return this.currentScopeTable.addEntry(symbolTableEntry);
		},

		/**
		 * Checks if an entry is in the symbol table; if it is, it links the node
		 * to that symbol table entry.
		 *
		 * @param {String} name
		 * @param {Compiler.TreeNode} node
		 * @param {String} optionalPath
		 *
		 * @returns {Boolean}
		 */
		hasEntry: function(name, node, optionalPath) {
			return this.currentScopeTable.hasEntry(name, node, optionalPath);
		},

		/**
		 * Detects the variable warnings.
		 *
		 * @returns {Array}
		 */
		getWarnings: function() {
			return this.defaultScopeTable.getWarnings();
		}
	});

	Compiler.SymbolTable = SymbolTable;

})(Backbone, Compiler);