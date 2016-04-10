(function (Backbone, Compiler) {

	var Tree = Compiler.ConcreteSyntaxTree.extend({

	}, {
		/**
		 * AST Node constants
		 */
		BLOCK_NODE: 'BLOCK',
		VAR_DECLARATION_NODE: 'Variable Declaration',
		ASSIGNMENT_STATEMENT_NODE: 'Assignment Statement',
		PRINT_STATEMENT_NODE: 'Print Statement',
		STRING_EXPRESSION_NODE: 'String Expression',
		IF_STATEMENT_NODE: 'If Statement',
		WHILE_STATEMENT_NODE: 'While Statement',
		ADD_NODE: 'Add',
		DIGIT_NODE: 'Digit',
		EQUAL_NODE: 'Equal',
		NOT_EQUAL_NODE: 'Not Equal',
		BOOLEAN_EXPRESSION_NODE: 'Boolean Expression',

		/**
		 * Determines whether the specified node type belongs in the AST.
		 *
		 * @param {String} node
		 * @returns {boolean}
		 */
		isInvalidNode: function (node) {
			var invalidNodes = ["=", "\"", "+", "(", ")", "print", "==", "!=", "if", "{", "}", "while"],
				matched = false;

			for (var i = 0; i < invalidNodes.length; i++) {
				if (invalidNodes[i] === node) {
					matched = true;
					break;
				}
			}

			return matched;
		},

		makeAST: function(cst) {
			var ast = new Compiler.AbstractSyntaxTree();

			function contains(node, desiredValue)
			{
				if (node !== null)
				{
					if (node.children.length === 0 && node.name == desiredValue)
					{
						return true;
					}

					var result = false,
						childResult = false;

					for (var i = 0; i < node.children.length; i++)
					{
						childResult = contains(node.children[i], desiredValue);

						// Logical OR, so 1 or more occurrences of desired value results in true
						result = result || childResult;
					}

					return result;
				}
			}

			function traverse(node, interiorNodePath)
			{
				var wentDownALevel = true;

				switch (node.name)
				{
					case Compiler.ConcreteSyntaxTree.BLOCK_NODE:
						ast.addNode(Compiler.AbstractSyntaxTree.BLOCK_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);
						break;
					case Compiler.ConcreteSyntaxTree.VAR_DECLARATION_NODE:
						interiorNodePath = Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE;
						ast.addNode(Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);
						break;
					case Compiler.ConcreteSyntaxTree.ASSIGNMENT_STATEMENT_NODE:
						interiorNodePath = Compiler.AbstractSyntaxTree.ASSIGNMENT_STATEMENT_NODE;
						ast.addNode(Compiler.AbstractSyntaxTree.ASSIGNMENT_STATEMENT_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);
						break;
					case Compiler.ConcreteSyntaxTree.PRINT_STATEMENT_NODE:
						interiorNodePath = Compiler.AbstractSyntaxTree.PRINT_STATEMENT_NODE;
						ast.addNode(Compiler.AbstractSyntaxTree.PRINT_STATEMENT_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);
						break;
					case Compiler.ConcreteSyntaxTree.IF_STATEMENT_NODE:
						interiorNodePath = Compiler.AbstractSyntaxTree.IF_STATEMENT_NODE;
						ast.addNode(Compiler.AbstractSyntaxTree.IF_STATEMENT_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);
						break;
					case Compiler.ConcreteSyntaxTree.WHILE_STATEMENT_NODE:
						interiorNodePath = Compiler.AbstractSyntaxTree.WHILE_STATEMENT_NODE;
						ast.addNode(Compiler.AbstractSyntaxTree.WHILE_STATEMENT_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);
						break;
					case Compiler.ConcreteSyntaxTree.INT_EXPRESSION_NODE:
						// Add plus subtree
						if(contains(node, '+'))
						{
							interiorNodePath = Compiler.AbstractSyntaxTree.ADD_NODE;
							ast.addNode(Compiler.AbstractSyntaxTree.ADD_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);
						}
						else
						{
							interiorNodePath = Compiler.AbstractSyntaxTree.DIGIT_NODE;
						}

						break;
					case Compiler.ConcreteSyntaxTree.STRING_EXPRESSION_NODE:
						interiorNodePath = Compiler.AbstractSyntaxTree.STRING_EXPRESSION_NODE;
						//ast.addNode(Compiler.AbstractSyntaxTree.STRING_EXPRESSION_NODE, Compiler.AbstractSyntaxTree.LEAF_NODE);
						break;

					case Compiler.ConcreteSyntaxTree.CHAR_LIST_NODE:
						var charList = '';
						for (var i = 0; i < node.children.length; i++)
						{
							charList += node.children[i].name;
						}

						ast.addNode(charList, Compiler.AbstractSyntaxTree.LEAF_NODE);
						break;

					case Compiler.ConcreteSyntaxTree.BOOLEAN_EXPRESSION_NODE:
						var comparisonOpFound = false;

						for (var i = 0; i < node.children.length && !comparisonOpFound; i++)
						{
							var currentNode = node.children[i];

							if (currentNode.name === "==")
							{
								interiorNodePath = Compiler.AbstractSyntaxTree.EQUAL_NODE;
								ast.addNode(Compiler.AbstractSyntaxTree.EQUAL_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);

								comparisonOpFound = true;
							}
							else if (currentNode.name === "!=")
							{
								interiorNodePath = Compiler.AbstractSyntaxTree.NOT_EQUAL_NODE;
								ast.addNode(Compiler.AbstractSyntaxTree.NOT_EQUAL_NODE, Compiler.AbstractSyntaxTree.BRANCH_NODE);

								comparisonOpFound = true;
							}
						}

						if (!comparisonOpFound)
						{
							interiorNodePath = Compiler.AbstractSyntaxTree.BOOLEAN_EXPRESSION_NODE;
						}

						break;

					case Compiler.ConcreteSyntaxTree.STATEMENT_LIST_NODE:
						interiorNodePath = null;
						break;

					default:
						wentDownALevel = false;
						break;
				}


				switch (interiorNodePath)
				{
					case Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE:
					case Compiler.AbstractSyntaxTree.ASSIGNMENT_STATEMENT_NODE:
					case Compiler.AbstractSyntaxTree.PRINT_STATEMENT_NODE:
					case Compiler.AbstractSyntaxTree.ADD_NODE:
					case Compiler.AbstractSyntaxTree.IF_STATEMENT_NODE:
					case Compiler.AbstractSyntaxTree.WHILE_STATEMENT_NODE:
					case Compiler.AbstractSyntaxTree.EQUAL_NODE:
					case Compiler.AbstractSyntaxTree.NOT_EQUAL_NODE:
						if (node.children.length == 0 && !Compiler.AbstractSyntaxTree.isInvalidNode(node.name))
						{
							ast.addNode(node.name, Compiler.AbstractSyntaxTree.LEAF_NODE);
						}

						break;

					case Compiler.AbstractSyntaxTree.DIGIT_NODE:
						if (node.children.length == 0 && !Compiler.AbstractSyntaxTree.isInvalidNode(node.name))
						{
							ast.addNode(node.name, Compiler.AbstractSyntaxTree.LEAF_NODE);
						}

						wentDownALevel = false;

						break;

					case Compiler.AbstractSyntaxTree.BOOLEAN_EXPRESSION_NODE:
						if (node.children.length == 0 && !Compiler.AbstractSyntaxTree.isInvalidNode(node.name))
						{
							ast.addNode(node.name, Compiler.AbstractSyntaxTree.LEAF_NODE);
						}

						wentDownALevel = false;

						break;

					default:
						break;
				}

				for (var i = 0; i < node.children.length; i++)
				{
					traverse(node.children[i], interiorNodePath);
				}

				if (wentDownALevel)
				{
					ast.endChildren();
				}
			}

			traverse(cst.root, null);

			return ast;
		}
	});

	Compiler.AbstractSyntaxTree = Tree;

})(Backbone, Compiler);