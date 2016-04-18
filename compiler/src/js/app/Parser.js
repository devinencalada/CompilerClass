/**
 * Top-Down recursive parser used to validate the source code.
 */

(function (Backbone, Compiler) {

	var Parser = Backbone.Model.extend({

		/**
		 * @property {Compiler.Token[]} Array of instances of Compiler.Token
		 */
		tokens: null,

		/**
		 * @property {Number} Index of the current token
		 */
		currentTokenIndex: 0,

		/**
		 * @property {Compiler.Lexer} lexer
		 */
		lexer: null,

		/**
		 * @property {Compiler.ConcreteSyntaxTree} cst - CST Tree
		 */
		cst: null,

		parse: function(sourceCode) {
			// Initialize properties
			this.lexer = new Compiler.Lexer();
			this.cst = new Compiler.ConcreteSyntaxTree();
			this.currentTokenIndex = 0;

			try
			{
				this.tokens = this.lexer.tokenize(sourceCode);
			}
			catch(err)
			{
				this.lexer = null;
				this.cst = null;
				this.tokens = null;
				this.currentTokenIndex = 0;
				throw err;
			}

			try
			{
				this._parseProgram();
			}
			catch(err)
			{
				this.cst = null;
				throw err;
			}
		},

		/**
		 * Wrapper public method to get the current token.
		 *
		 * @returns {Compiler.Token}
		 */
		getCurrentToken: function() {
			return this._getTokenAt();
		},

		/**
		 * Wrapper public method used to advance the current token
		 */
		consumeToken: function() {
			var currentToken = this.getCurrentToken();
			Compiler.Logger.log(currentToken.get('name') + ' consumed!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			// Add Leaf Node to the CST
			this.cst.addNode(Compiler.TreeNode.createNode(currentToken.get('code'), currentToken, Compiler.TreeNode.LEAF_NODE));

			this._getNextToken();
		},

		/**
		 * Program ::== Block $
		 *
		 * @private
		 */
		_parseProgram: function () {

			Compiler.Logger.log('Performing Parsing', Compiler.Logger.INFO, Compiler.Logger.PARSER);

			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.PROGRAM_NODE, Compiler.TreeNode.BRANCH_NODE));

			this._parseBlock();
			this._parseEOF();

			Compiler.Logger.log('Parsing Complete', Compiler.Logger.INFO, Compiler.Logger.PARSER);
			Compiler.Logger.log('Parsing produced 0 errors and 0 warnings', Compiler.Logger.INFO, Compiler.Logger.PARSER);
		},

		/**
		 * Block ::== { StatementList }
		 * @private
		 */
		_parseBlock: function() {

			// Add the "<Block>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.BLOCK_NODE, Compiler.TreeNode.BRANCH_NODE));

			// Verify the current token is a "{"
			Compiler.Logger.log('T_LBRACE expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if (currentToken.get('type') !== Compiler.Token.T_LBRACE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_LBRACE);
			}

			// Token is a "{"
			this.consumeToken();

			// Parse the statement list
			this._parseStatementList();

			// Verify the current token is a "}"
			Compiler.Logger.log('T_RBRACE expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			currentToken = this.getCurrentToken();
			if (currentToken.get('type') !== Compiler.Token.T_RBRACE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_RBRACE);
			}

			// Token is a "}"
			this.consumeToken();

			// Close the "<Block>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * StatementList ::== Statement StatementList
		 *
		 * @private
		 */
		_parseStatementList: function() {
			// Add the "<Statement List>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.STATEMENT_LIST_NODE, Compiler.TreeNode.BRANCH_NODE));

			var currentToken = this.getCurrentToken();

			switch(currentToken.get('type'))
			{
				case Compiler.Token.T_PRINT:
				case Compiler.Token.T_ID:
				case Compiler.Token.T_INT:
				case Compiler.Token.T_STRING:
				case Compiler.Token.T_BOOLEAN:
				case Compiler.Token.T_WHILE:
				case Compiler.Token.T_IF:
				case Compiler.Token.T_LBRACE:
					this._parseStatement();
					this._parseStatementList();
					break;

				default:
					break;
			}

			// Close the "<Statement List>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * Statement ::== PrintStatement
		 * Statement ::== AssignmentStatement
		 * Statement ::== VarDecl
		 * Statement ::== WhileStatement
		 * Statement ::== IfStatement
		 * Statement ::== Block
		 *
		 * @private
		 */
		_parseStatement: function() {
			// Add the "<Statement>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.STATEMENT_NODE, Compiler.TreeNode.BRANCH_NODE));

			var currentToken = this.getCurrentToken();

			switch (currentToken.get('type'))
			{
				case Compiler.Token.T_PRINT:
					this._parsePrintStatement();
					break;

				case Compiler.Token.T_ID:
					this._parseAssignmentStatement();
					break;

				case Compiler.Token.T_INT:
				case Compiler.Token.T_STRING:
				case Compiler.Token.T_BOOLEAN:
					this._parseVariableDeclaration();
					break;

				case Compiler.Token.T_WHILE:
					this._parseWhileStatement();
					break;

				case Compiler.Token.T_IF:
					this._parseIfStatement();
					break;

				case Compiler.Token.T_LBRACE:
					this._parseBlock();
					break;

				default:
					this._throwException(currentToken, '{name} is not the beginning of an statement.');
					break;
			}

			// Close the "<Statement>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * PrintStatement ::== print (Expr)
		 *
		 * @private
		 */
		_parsePrintStatement: function() {
			// Add the "<Print Statement>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.PRINT_STATEMENT_NODE, Compiler.TreeNode.BRANCH_NODE));

			// Verify the current token is of type "T_PRINT"
			Compiler.Logger.log('T_PRINT expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_PRINT)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_PRINT);
			}

			// Token is of type "T_PRINT"
			this.consumeToken();

			// Verify the current token is a "("
			Compiler.Logger.log('T_LPAREN expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_LPAREN)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_LPAREN);
			}

			// Token is a "("
			this.consumeToken();

			// Parse the expression
			this._parseExpression();

			// Verify the current token is a ")"
			Compiler.Logger.log('T_RPAREN expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_RPAREN)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_RPAREN);
			}

			// Token is a ")"
			this.consumeToken();

			// Close the "<Print Statement>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * AssignmentStatement ::== Id = Expr
		 *
		 * @private
		 */
		_parseAssignmentStatement: function() {
			// Add the "<Assignment Statement>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.ASSIGNMENT_STATEMENT_NODE, Compiler.TreeNode.BRANCH_NODE));

			// Parse token of type T_ID
			this._parseId();

			// Verify the current token is a "="
			Compiler.Logger.log('T_SINGLE_EQUALS expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_SINGLE_EQUALS)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_SINGLE_EQUALS);
			}

			// The current token is a "="
			this.consumeToken();

			// Parse the expression
			this._parseExpression();

			// Close the "<Assignment Statement>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * VarDecl ::== type Id
		 *
		 * @private
		 */
		_parseVariableDeclaration: function() {
			// Add the "<Variable Declaration>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.VAR_DECLARATION_NODE, Compiler.TreeNode.BRANCH_NODE));

			this._parseType();
			this._parseId();

			// Close the "<Variable Statement>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * WhileStatement ::== while BooleanExpr Block
		 *
		 * @private
		 */
		_parseWhileStatement: function() {
			// Add the "<While Statement>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.WHILE_STATEMENT_NODE, Compiler.TreeNode.BRANCH_NODE));

			Compiler.Logger.log('T_WHILE expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_WHILE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_WHILE);
			}

			this.consumeToken();

			this._parseBooleanExpression();
			this._parseBlock();

			// Close the "<While Statement>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * IfStatement ::== if BooleanExpr Block
		 *
		 * @private
		 */
		_parseIfStatement: function() {

			// Add the "<If Statement>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.IF_STATEMENT_NODE, Compiler.TreeNode.BRANCH_NODE));

			Compiler.Logger.log('T_IF expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_IF)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_IF);
			}

			this.consumeToken();

			this._parseBooleanExpression();
			this._parseBlock();

			// Close the "<If Statement>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * Expr ::== IntExpr
		 * Expr ::== StringExpr
		 * Expr ::== BooleanExpr
		 * Expr ::== Id
		 *
		 * @private
		 */
		_parseExpression: function() {
			// Add the "<Expression>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.EXPRESSION_NODE, Compiler.TreeNode.BRANCH_NODE));

			var currentToken = this.getCurrentToken();

			switch(currentToken.get('type'))
			{
				case Compiler.Token.T_DIGIT:
					this._parseIntExpression();
					break;

				case Compiler.Token.T_QUOTE:
					this._parseStringExpression();
					break;

				case Compiler.Token.T_LPAREN:
				case Compiler.Token.T_TRUE:
				case Compiler.Token.T_FALSE:
					this._parseBooleanExpression();
					break;

				case Compiler.Token.T_ID:
					this._parseId();
					break;

				default:
					this._throwException(currentToken, 'Found {name} but expected an expression.');
					break;
			}

			// Close the "<Expression>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * IntExpr ::== digit intop Expr
		 * IntExpr ::== digit
		 *
		 * @private
		 */
		_parseIntExpression: function() {
			// Add the "<Int Expression>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.INT_EXPRESSION_NODE, Compiler.TreeNode.BRANCH_NODE));

			Compiler.Logger.log('T_DIGIT expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_DIGIT)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_DIGIT);
			}

			this.consumeToken();

			currentToken = this.getCurrentToken();
			if(currentToken.get('type') === Compiler.Token.T_PLUS)
			{
				this._parseIntOperator();
				this._parseExpression();
			}

			// Close the "<Int Expression>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * StringExpr ::== CharList
		 *
		 * @private
		 */
		_parseStringExpression: function() {
			// Add the "<String Expression>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.STRING_EXPRESSION_NODE, Compiler.TreeNode.BRANCH_NODE));

			// Verify the current token is a quote
			Compiler.Logger.log('T_QUOTE expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_QUOTE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_QUOTE);
			}

			// The current token is a quote
			this.consumeToken();

			// Parse the character list
			this._parseCharList();

			// Verify the current token is a quote
			Compiler.Logger.log('T_QUOTE expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_QUOTE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_QUOTE);
			}

			// The current token is a quote
			this.consumeToken();

			// Close the "<String Expression>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * BooleanExpr ::== ( Expr boolop Expr )
		 * BooleanExpr ::== boolval
		 *
		 * @private
		 */
		_parseBooleanExpression: function() {
			// Add the "<Boolean Expression>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.BOOLEAN_EXPRESSION_NODE, Compiler.TreeNode.BRANCH_NODE));

			Compiler.Logger.log('T_LPAREN, T_TRUE or T_FALSE expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();

			// Is the current token a "(" ?
			if(currentToken.get('type') === Compiler.Token.T_LPAREN)
			{
				// The current token is a "("
				this.consumeToken();

				this._parseExpression();
				this._parseBooleanOperator();
				this._parseExpression();

				// Verify the current token is a ")"
				currentToken = this.getCurrentToken();
				if(currentToken.get('type') !== Compiler.Token.T_RPAREN)
				{
					this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_RPAREN);
				}

				// The current token is a ")"
				this.consumeToken();
			}
			else if(currentToken.get('type') === Compiler.Token.T_TRUE
				|| currentToken.get('type') === Compiler.Token.T_FALSE)
			{
				this.consumeToken();
			}
			else
			{
				this._throwException(currentToken, '{name} is not the beginning of a boolean expression.');
			}

			// Close the "<Boolean Expression>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * type ::== int | string | boolean
		 *
		 * @private
		 */
		_parseType: function() {

			var currentToken = this.getCurrentToken();

			switch(currentToken.get('type'))
			{
				case Compiler.Token.T_INT:
				case Compiler.Token.T_STRING:
				case Compiler.Token.T_BOOLEAN:
					this.consumeToken();
					break;

				default:
					this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_TYPE);
					break;
			}
		},

		/**
		 * Id ::== char
		 *
		 * @private
		 */
		_parseId: function() {

			// Verify the current token is of type T_ID
			Compiler.Logger.log('T_ID expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_ID)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_ID);
			}

			// The current token is valid
			this.consumeToken();
		},

		/**
		 * CharList ::== char
		 * CharList ::== space
		 * CharList ::== ε
		 *
		 * @private
		 */
		_parseCharList: function() {
			// Add the "<Char List>" node to the CST tree
			this.cst.addNode(Compiler.TreeNode.createNode(Compiler.ConcreteSyntaxTree.CHAR_LIST_NODE, Compiler.TreeNode.BRANCH_NODE));

			// Verify the current token is a character or white space
			Compiler.Logger.log('T_ID expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			while(currentToken.get('type') === Compiler.Token.T_CHAR || currentToken.get('type') === Compiler.Token.T_WHITE_SPACE)
			{
				this.consumeToken();
				currentToken = this.getCurrentToken();
			}

			// Close the "<Char List>" node in the CST tree
			this.cst.endChildren();
		},

		/**
		 * intop ::== +
		 *
		 * @private
		 */
		_parseIntOperator: function() {
			// Verify the current token a "+"
			Compiler.Logger.log('T_PLUS expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_PLUS)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_PLUS);
			}

			// The current token is a "+"
			this.consumeToken();
		},

		/**
		 * boolop ::== == | !=
		 *
		 * @private
		 */
		_parseBooleanOperator: function() {
			var currentToken = this.getCurrentToken();
			switch(currentToken.get('type'))
			{
				case Compiler.Token.T_DOUBLE_EQUALS:
				case Compiler.Token.T_NOT_EQUALS:
					this.consumeToken();
					break;
				default:
					this._throwException(currentToken, '{name} is not a valid boolean operator.');
					break;
			}
		},

		/**
		 * Parses the EOF token. This method checks
		 * the current token is the EOF token.
		 *
		 * @private
		 */
		_parseEOF: function () {

			Compiler.Logger.log('T_EOF expected!', Compiler.Logger.INFO, Compiler.Logger.PARSER, true);

			var token = this.getCurrentToken();
			if (token.get('type') === Compiler.Token.T_EOF)
			{
				this.consumeToken();
			}
			else
			{
				this._throwExceptionByToken(token);
			}
		},

		/**
		 * Throws exception using the specified error message.
		 *
		 * @param {Number|Compiler.Token} token
		 * @param {String} message
		 * @private
		 */
		_throwException: function(token, message) {
			if(typeof token == 'number')
			{
				token = Compiler.Token.getTokenByType(token);
			}

			var errorMessage = "Error on line {line}: " + message;
			errorMessage = errorMessage.replace("{name}", token.get('name')).replace("{line}", token.get('line'));
			

			Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.PARSER);

			throw errorMessage;
		},

		/**
		 * Throw exception according to the type of the
		 * specified token.
		 *
		 * @param {Number|Compiler.Token} token
		 * @private
		 */
		_throwExceptionByToken: function(token) {
			if(typeof token == 'number')
			{
				token = Compiler.Token.getTokenByType(token);
			}

			var errorMessage = '';
			switch(token.get('type'))
			{
				case Compiler.Token.T_EOF:
					break;
				default:
					errorMessage = "\"{name}\" expected on line {line}.";
					break;
			}

			var errorMessage = errorMessage.replace("{name}", token.get('name')).replace("{line}", token.get('line'));
			Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.PARSER);

			throw errorMessage;
		},

		/**
		 * Throw exception when the expected token is invalid.
		 *
		 * @param {Number|Compiler.Token} token
		 * @param {Number|Compiler.Token} expectedToken
		 * @returns {string}
		 * @private
		 */
		_throwInvalidTokenFoundException: function(token, expectedToken) {
			if(typeof token == 'number')
			{
				token = Compiler.Token.getTokenByType(token);
			}

			if(typeof expectedToken == 'number')
			{
				expectedToken = Compiler.Token.getTokenByType(expectedToken);
			}

			var errorMessage = "Found " + token.get('name') + ", expected " + expectedToken.get('name') + ".";
			this._throwException(token, errorMessage);
		},

		/**
		 * Returns the token at the specified index.
		 * The token at the currentTokenIndex is returned if no
		 * index is specified
		 *
		 * @private
		 */
		_getTokenAt: function(index) {
			return this.tokens.at(typeof index == 'undefined' ? this.currentTokenIndex : index);
		},

		/**
		 * Private method.
		 *
		 * Returns the next token in the token list
		 * without updating the currentTokenIndex property.
		 *
		 * @returns {Compiler.Token}
		 */
		_peekAtNextToken: function() {
			var nextTokenIndex = this.currentTokenIndex + 1;
			if(nextTokenIndex > this.tokens.length)
			{
				return null;
			}

			return this.tokens.at(nextTokenIndex);
		},

		/**
		 * Private method.
		 * Returns the next token in the token list.
		 *
		 * @returns {Compiler.Token}
		 */
		_getNextToken: function() {
			var nextTokenIndex = this.currentTokenIndex + 1;
			if(nextTokenIndex > this.tokens.length)
			{
				return null;
			}

			// Update the current token's index
			this.currentTokenIndex = nextTokenIndex;

			// Return the token
			return this.tokens.at(this.currentTokenIndex);
		}
	});

	Compiler.Parser = Parser;

})(Backbone, Compiler);