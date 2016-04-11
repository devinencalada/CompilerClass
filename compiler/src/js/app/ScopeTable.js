/**
 * Classed used to represent the scope table.
 */

(function (Backbone, Compiler) {

	var ScopeTable = Backbone.Model.extend({
		/**
		 * @property {Backbone.Collection} entries - List of symbol entries
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
		childScopes: null,

		initialize: function() {
			this.entries = Backbone.Collection();
			this.childScopes = [];
		},

		/**
		 * Add entry to the symbol table.
		 *
		 * @param {Compiler.SymbolTableEntry} symbolTableEntry
		 */
		addEntry: function(symbolTableEntry) {
			symbolTableEntry.set({
				entry_number: this.entries.length + 1,
				scope: this.scopeLevel
			});

			var exists = this.entries.findWhere({
				name: symbolTableEntry.get('name')
			});

			if(exists)
			{
				return false;
			}

			Compiler.Logger.log('Inserting id ' + symbolTableEntry.get('name') + ' from line ' + symbolTableEntry.get('line') + ' into symbol table at scope: ' + symbolTableEntry.get('scope'), Compiler.Logger.INFO, Compiler.Logger.SCOPE_TABLE);

			this.entries.add(symbolTableEntry);
			return true;
		}
	});

	Compiler.ScopeTable = ScopeTable;

})(Backbone, Compiler);