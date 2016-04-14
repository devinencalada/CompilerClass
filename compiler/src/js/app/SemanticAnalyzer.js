/**
 * Classed used to represent the semantic analyzer.
 */

(function (Backbone, Compiler) {

	var SemanticAnalyzer = Backbone.Model.extend({

		/**
		 * Traverses the specified tree and checks to make sure all
		 * the variable assignment match the variable types.
		 *
		 * @param {Compiler.AbstractSyntaxTree} ast
		 * @param {Compiler.SymbolTable} symbolTable
		 */
		typeCheck: function(ast, symbolTable) {

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
						Compiler.Logger.log("Checking if " + leftSiblingType + " is type compatible with " + rightSiblingType + " on line " + node.children[0].get('line') + ".", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);

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

								Compiler.Logger.log("Propagating the type " + typeToPropagate + " on line " + node.children[0].get('line') + " up to the parent " + parentNode.name + ".", Compiler.Logger.INFO, Compiler.Logger.SEMANTIC_ANALYSIS, true);

								parentNode.setSiblingType(typeToPropagate);
							}

							node.type = leftSiblingType;
						}
						else
						{
							var errorMessage = "Error! Type mismatch on line " + node.children[0].get('line') + ": " + node.children[0].name + " with the type " + leftSiblingType + " on the LHS does not match the type " + rightSiblingType + " on the RHS of the expression.";
							Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS);
							throw errorMessage;
						}
					}
					else if (leftSiblingType && !rightSiblingType)
					{
						Compiler.Logger.log("Setting type of " + node.name + " on line " + node.children[0].get('line') + " to " + leftSiblingType + ".", Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS, true);
						node.type = leftSiblingType;
					}
					else if(!leftSiblingType && rightSiblingType)
					{
						Compiler.Logger.log("Setting type of " + node.name + " on line " + node.children[0].get('line') + " to " + rightSiblingType + ".", Compiler.Logger.ERROR, Compiler.Logger.SEMANTIC_ANALYSIS, true);
						node.type = rightSiblingType;
					}
				}
			}

			traverse(node.root, symbolTable);
		}
	});

	Compiler.SemanticAnalyzer = SemanticAnalyzer;

})(Backbone, Compiler);