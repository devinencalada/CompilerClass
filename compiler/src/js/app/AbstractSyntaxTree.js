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
		BOOLEAN_EXPRESSION_NODE: 'Boolean Expression'
	});

	Compiler.AbstractSyntaxTree = Tree;

})(Backbone, Compiler);