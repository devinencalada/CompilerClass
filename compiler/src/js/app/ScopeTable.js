/**
 * Classed used to represent the scope table.
 */

(function (Backbone, Compiler) {

	var ScopeTable = Backbone.Model.extend({

		defaults: {
			scope: -1 // Current scope level
		},

		/**
		 * @property {Backbone.Collection} entries - List of symbol entries
		 */
		entries: null,

		/**
		 * @property {Compiler.ScopeTable} parentScopeTable - Parent scope table
		 */
		parentScopeTable: null,

		/**
		 * @property {Compiler.ScopeTable[]} childScopeTables - List of child scope tables
		 */
		childScopeTables: null,

		initialize: function() {
			this.entries = new Backbone.Collection();
			this.childScopeTables = [];
		},

		/**
		 * Add entry to the symbol table.
		 *
		 * @param {Compiler.SymbolTableEntry} symbolTableEntry
		 *
		 * @returns {Boolean}
		 */
		addEntry: function(symbolTableEntry) {
			symbolTableEntry.set({
				entry_number: this.entries.length + 1,
				scope: this.get('scope')
			});

			var exists = this.getEntry(symbolTableEntry.get('name'));
			if(exists)
			{
				return false;
			}

			Compiler.Logger.log('Inserting id ' + symbolTableEntry.get('name') + ' from line ' + symbolTableEntry.get('line') + ' into symbol table at scope: ' + symbolTableEntry.get('scope'), Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS);

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
		 *
		 * @returns {Boolean}
		 */
		hasEntry: function(name, node, optionalPath) {
			var scopeTable = this,
				found = false;

			Compiler.Logger.log('Checking if id ' + name + ' is in the symbol table.', Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);

			while (scopeTable && !found)
			{
				var symbolTableEntry = scopeTable.getEntry(name);

				if (!symbolTableEntry)
				{
					scopeTable = scopeTable.parentScopeTable;
				}
				else
				{
					Compiler.Logger.log('The id ' + name + ' at the scope level ' + scopeTable.get('scope') + ' was in the symbol table.', Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);

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
							Compiler.Logger.log('Warning! The id ' + symbolTableEntry.get('name') + ' on line ' + node.token.get('line') + ' was used before being initialized first.', Compiler.Logger.WARNING, Compiler.Logger.SEMANTIC_ANALYSIS, true);
						}
					}

					node.symbolTableEntry = symbolTableEntry;

					found = true;
				}
			}

			return found;
		},

		/**
		 * Returns all the variable warnings.
		 *
		 * @param {Compiler.ScopeTable} scopeTable
		 *
		 * @returns {Array}
		 */
		getWarnings: function () {

			var warnings = [];

			function traverse(scopeTable)
			{
				scopeTable.entries.each(function(symbolTableEntry) {
					if(symbolTableEntry.get('references') == 1)
					{
						warnings.push('Warning! The id ' + symbolTableEntry.get('name') + ' declared on line ' + symbolTableEntry.get('line') + ' was declared, but never used.');
					}

					if(!symbolTableEntry.get('initialized'))
					{
						warnings.push('Warning! The id ' + symbolTableEntry.get('name') + ' declared on line ' + symbolTableEntry.get('line') + ' was never initialized.');
					}
				});

				for (var i = 0; i < scopeTable.childScopeTables.length; i++)
				{
					traverse(scopeTable.childScopeTables[i]);
				}
			}

			traverse(this);

			return warnings;
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