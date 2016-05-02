/**
 * Classed used to represent the semantic analyzer.
 */

(function (Backbone, Compiler) {

	var SemanticAnalyzer = Backbone.Model.extend({
		/**
		 * @property {Compiler.AbstractSyntaxTree} ast
		 */
		ast: null,

		/**
		 * @property {Compiler.SymbolTable} symbolTable
		 */
		symbolTable: null,

		analyze: function(ast) {

			Compiler.Logger.log("Performing Semantic Analysis", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS);

			this.ast = ast;
			this.symbolTable = Compiler.SymbolTable.makeSymbolTable(ast);

			try
			{
				this._scopeTypeCheck();
			}
			catch(err)
			{

			}

			Compiler.Logger.log("Semantic Analysis Complete");

			var warnings = this.symbolTable.getWarnings();

			if (warnings.length > 0)
			{
				Compiler.Logger.log("Warnings", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS);

				for (var i = 0; i < warnings.length ; i++)
				{
					Compiler.Logger.log(warnings[i], Compiler.Logger.WARNING, Compiler.Logger.SEMANTIC_ANALYSIS);
				}
			}

			Compiler.Logger.log("Semantic Analysis produced " + Compiler.Logger.getCount(Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS)  + " error(s) and " + Compiler.Logger.getCount(Compiler.Logger.WARNING, Compiler.Logger.SEMANTIC_ANALYSIS) + " warning(s).", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS);
		},

		/**
		 * Traverses the specified tree and checks to make sure all
		 * the variable assignment match the variable types.
		 *
		 * @param {Compiler.AbstractSyntaxTree} ast
		 * @param {Compiler.SymbolTable} symbolTable
		 */
		_scopeTypeCheck: function() {

			function traverse(node, symbolTable)
			{
				if(node.isLeaf())
				{
					var tokenType = node.token.get('type');

					if(node.name === Compiler.AbstractSyntaxTree.STRING_EXPRESSION_NODE)
					{
						tokenType = Compiler.Token.T_STRING_EXPRESSION;
						node.token.set('type', tokenType);
					}

					var parentNode = node.parent,
						type;

					switch (tokenType)
					{
						case Compiler.Token.T_INT:
						case Compiler.Token.T_STRING:
						case Compiler.Token.T_BOOLEAN:
							type = node.name;
							break;

						case Compiler.Token.T_ID:
							type = node.symbolTableEntry.get('type');
							break;

						case Compiler.Token.T_DIGIT:
							type = 'int';
							break;

						case Compiler.Token.T_STRING_EXPRESSION:
							type = 'string';
							break;

						case Compiler.Token.T_TRUE:
						case Compiler.Token.T_FALSE:
							type = 'boolean';
							break;

						default:
							break;
					}

					if(type)
					{
						parentNode.setSiblingType(type);
						node.type = type;
					}
				}

				for (var i = 0; i < node.children.length; i++)
				{
					traverse(node.children[i], symbolTable);
				}

				// Propagate type info up the tree by combining type info from nodes children
				if (node.isBranch() && node.name !== Compiler.AbstractSyntaxTree.BLOCK_NODE)
				{
					var leftSiblingType = node.leftSiblingType,
						rightSiblingType = node.rightSiblingType,
						parentNode = node.parent;

					if(leftSiblingType && rightSiblingType)
					{
						Compiler.Logger.log("Checking if " + leftSiblingType + " is type compatible with " + rightSiblingType + " on line " + node.children[0].token.get('line') + ".", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);

						if (leftSiblingType === rightSiblingType)
						{
							if (parentNode.name !== Compiler.AbstractSyntaxTree.BLOCK_NODE)
							{
								// leftSiblingType == rightSiblingType, so either is fine
								var typeToPropagate = leftSiblingType;

								// Propagate boolean result from comparison
								if (node.name === Compiler.AbstractSyntaxTree.EQUAL_NODE || node.name === Compiler.AbstractSyntaxTree.NOT_EQUAL_NODE)
								{
									typeToPropagate = 'boolean';
								}

								Compiler.Logger.log("Propagating the type " + typeToPropagate + " on line " + node.children[0].token.get('line') + " up to the parent " + parentNode.name + ".", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);

								parentNode.setSiblingType(typeToPropagate);
							}

							node.type = leftSiblingType;
						}
						else
						{
							var errorMessage = "Error! Type mismatch on line " + node.children[0].token.get('line') + ": " + node.children[0].name + " with the type " + leftSiblingType + " on the LHS does not match the type " + rightSiblingType + " on the RHS of the expression.";
							Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS);
							throw errorMessage;
						}
					}
					else if (leftSiblingType && !rightSiblingType)
					{
						Compiler.Logger.log("Setting type of " + node.name + " to " + leftSiblingType + ".", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);
						node.type = leftSiblingType;
					}
					else if(!leftSiblingType && rightSiblingType)
					{
						Compiler.Logger.log("Setting type of " + node.name + " to " + rightSiblingType + ".", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);
						node.type = rightSiblingType;
					}
				}
			}

			traverse(this.ast.root, this.symbolTable);
		}
	});

	Compiler.SemanticAnalyzer = SemanticAnalyzer;

})(Backbone, Compiler);