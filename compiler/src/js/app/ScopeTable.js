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
		 * @property {Compiler.ScopeTable} parentScopeTable - Parent scope table
		 */
		parentScopeTable: null,

		/**
		 * @property {Compiler.ScopeTable[]} childScopeTables - List of child scope tables
		 */
		childScopeTables: null,

		initialize: function() {
			this.entries = Backbone.Collection();
			this.childScopeTables = [];
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

			var exists = this.getEntry(symbolTableEntry.get('name'));
			if(exists)
			{
				return false;
			}

			Compiler.Logger.log('Inserting id ' + symbolTableEntry.get('name') + ' from line ' + symbolTableEntry.get('line') + ' into symbol table at scope: ' + symbolTableEntry.get('scope'), Compiler.Logger.INFO, Compiler.Logger.SCOPE_TABLE);

			this.entries.add(symbolTableEntry);

			return true;
		},

		/**
		 * Checks if id is in the symbol table; if it is, it links the node
		 * to that symbol table entry.
		 *
		 * @param {String} name
		 * @param {Compiler.TreeNode} node
		 * @param {String} optionalPath
		 * @returns {boolean}
		 */
		hasEntry: function(name, node, optionalPath) {
			var currScopeTable = this,
				found = false;

			Compiler.Logger.log('Checking if id ' + name + ' is in the symbol table', Compiler.Logger.INFO, Compiler.Logger.SCOPE_TABLE);

			while (currScopeTable && !found)
			{
				var symbolTableEntry = currScopeTable.getEntry(name);

				if (!symbolTableEntry)
				{
					currScopeTable = currScopeTable.parentScopeTable;
				}
				else
				{
					Compiler.Logger.log('The id ' + name + ' at the scope level ' + currScopeTable.scopeLevel + ' was in the symbol table', Compiler.Logger.INFO, Compiler.Logger.SCOPE_TABLE);

					symbolTableEntry.incrementReferences();

					if(optionalPath == Compiler.AbstractSyntaxTree.ASSIGNMENT_STATEMENT_NODE)
					{
						symbolTableEntry.set('initialized', true);
					}

					var parentNode = node.parent;

					if (optionalPath != Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE
						&& parentNode.name != Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE)
					{
						if (!symbolTableEntry.get('initialized'))
						{
							Compiler.Logger.log('Warning! The id ' + symbolTableEntry.get('name') + ' on line ' + node.token('line') + ' was used before being initialized first', Compiler.Logger.WARNING, Compiler.Logger.SCOPE_TABLE);
						}
					}

					node.setSymbolTableEntry(symbolTableEntry);

					found = true;
				}
			}

			return found;
		},

		/**
		 * Detects variable warnings.
		 *
		 * @param {Compiler.ScopeTable} scopeTable
		 */
		detectWarnings: function (scopeTable) {

			scopeTable.entries.each(function(symbolTableEntry) {
				if(symbolTableEntry.get('references') == 1)
				{
					Compiler.Logger.log('Warning! The id ' + symbolTableEntry.get('name') + ' declared on line ' + symbolTableEntry.get('line') + ' was declared, but never used', Compiler.Logger.WARNING, Compiler.Logger.SCOPE_TABLE);
				}

				if(!symbolTableEntry.get('initialized'))
				{
					Compiler.Logger.log('Warning! The id ' + symbolTableEntry.get('name') + ' declared on line ' + symbolTableEntry.get('line') + ' was never initialized', Compiler.Logger.WARNING, Compiler.Logger.SCOPE_TABLE);
				}
			});

			for (var i = 0; i < scopeTable.childScopeTables.length; i++)
			{
				scopeTable.detectWarnings(scopeTable.childScopeTables[i]);
			}
		},

		// Utility methods

		/**
		 * Return the specified symbol table entry.
		 *
		 * @param {String} name
		 * @returns {Compiler.SymbolTableEntry}
		 */
		getEntry: function(name) {
			return this.entries.findWhere({
				name: name
			});
		},

		/**
		 * Adds a child scope table.
		 *
		 * @param {Compiler.ScopeTable} scopeTable
		 */
		addChildScopeTable: function(scopeTable) {
			this.childScopeTables.push(scopeTable);
		}
	});

	Compiler.ScopeTable = ScopeTable;

})(Backbone, Compiler);