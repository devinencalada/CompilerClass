(function (Backbone, Compiler) {

	var Tree = Compiler.Tree.extend({

	}, {
		/**
		 * CST Node constants
		 */
		PROGRAM_NODE: 'Program',
		BLOCK_NODE: 'Block',
		STATEMENT_LIST_NODE: 'Statement List',
		STATEMENT_NODE: 'Statement',
		PRINT_STATEMENT_NODE: 'Print Statement',
		ASSIGNMENT_STATEMENT_NODE: 'Assignment Statement',
		VAR_DECLARATION_NODE: 'Variable Declaration',
		WHILE_STATEMENT_NODE: 'While Statement',
		IF_STATEMENT_NODE: 'If Statement',
		EXPRESSION_NODE: 'Expression',
		INT_EXPRESSION_NODE: 'Int Expression',
		STRING_EXPRESSION_NODE: 'String Expression',
		BOOLEAN_EXPRESSION_NODE: 'Boolean Expression',
		CHAR_LIST_NODE: 'Char List'
	});

	Compiler.ConcreteSyntaxTree = Tree;

})(Backbone, Compiler);