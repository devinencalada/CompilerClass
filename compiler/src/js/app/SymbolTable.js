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
				Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS);
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
	}, {

		/**
		 * Builds the symbol using an AST.
		 *
		 * @param {Compiler.AbstractSyntaxTree} ast
		 *
		 * @returns {Compiler.SymbolTable}
		 */
		makeSymbolTable: function(ast) {
			var symbolTable = new Compiler.SymbolTable();

			function traverse(node, symbolTable)
			{
				var newScope = false,
					optionalPath = '';

				switch(node.name)
				{
					case Compiler.AbstractSyntaxTree.BLOCK_NODE:
						symbolTable.openScope();
						newScope = true;
						break;

					case Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE:
						var name = node.children[1].name,
							type = node.children[0].name,
							line = node.children[1].token.get('line');

						var insertResult = symbolTable.addEntry(Compiler.SymbolTableEntry.createEntry(name, type, line));

						optionalPath = Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE;

						if(!insertResult)
						{
							var errorMessage = 'Error! Duplicate declaration of id ' + name + ' found on line ' + line + '.';
							Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS);
							throw errorMessage;
						}

						break;

					case Compiler.AbstractSyntaxTree.ASSIGNMENT_STATEMENT_NODE:
						var name = node.children[0].name,
							line = node.children[0].token.get('line');

						var result = symbolTable.hasEntry(node.children[0].name, node, Compiler.AbstractSyntaxTree.ASSIGNMENT_STATEMENT_NODE);
						if(!result)
						{
							var errorMessage = 'Error! The id ' + name + ' on line ' + line + ' was used before being declared.';
							Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS);
							throw errorMessage;
						}

						break;
				}

				if(node.token && node.token.get('type') === Compiler.Token.T_ID)
				{
					var name = node.name,
						line = node.token.get('line');

					var result = symbolTable.hasEntry(name, node, optionalPath);
					if(!result)
					{
						var errorMessage = 'Error! The id ' + id + ' on line ' + line + ' was used before being declared.';
						Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS);
						throw errorMessage;
					}
				}

				for(var i = 0; i < node.children.length; i++)
				{
					traverse(node.children[i], symbolTable);
				}

				if(newScope)
				{
					symbolTable.closeScope();
				}
			}

			traverse(ast.root, symbolTable);

			return symbolTable;
		}
	});

	Compiler.SymbolTable = SymbolTable;

})(Backbone, Compiler);