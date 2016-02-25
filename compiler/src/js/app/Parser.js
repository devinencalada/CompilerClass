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

		parse: function() {
			this._parseProgram();
		},

		/**
		 * Sets the tokens property. Setting the tokens property
		 * will also reset the currentTokenIndex to 0
		 *
		 * @param {Compiler.Token[]} tokens
		 */
		setTokens: function(tokens) {
			this.currentTokenIndex = 0;
			this.tokens = tokens;
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
			this._getNextToken();
		},

		/**
		 * Program ::== Block $
		 *
		 * @private
		 */
		_parseProgram: function () {
			this._parseBlock();
			this._parseEOF();
		},

		/**
		 * Block ::== { StatementList }
		 * @private
		 */
		_parseBlock: function() {

			// Verify the current token is a "{"
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
			currentToken = this.getCurrentToken();
			if (currentToken.get('type') !== Compiler.Token.T_RBRACE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_RBRACE);
			}

			// Token is a "}"
			this.consumeToken();
		},

		/**
		 * StatementList ::== Statement StatementList
		 *
		 * @private
		 */
		_parseStatementList: function() {
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
		},

		/**
		 * PrintStatement ::== print (Expr)
		 *
		 * @private
		 */
		_parsePrintStatement: function() {

			// Verify the current token is of type "T_PRINT"
			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_PRINT)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_PRINT);
			}

			// Token is of type "T_PRINT"
			this.consumeToken();

			// Verify the current token is a "("
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
			currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_RPAREN)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_RPAREN);
			}

			// Token is a ")"
			this.consumeToken();
		},

		/**
		 * AssignmentStatement ::== Id = Expr
		 *
		 * @private
		 */
		_parseAssignmentStatement: function() {

			// Parse token of type T_ID
			this._parseId();

			// Verify the current token is a "="
			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_SINGLE_EQUALS)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_SINGLE_EQUALS);
			}

			// The current token is a "="
			this.consumeToken();

			// Parse the expression
			this._parseExpression();
		},

		/**
		 * VarDecl ::== type Id
		 *
		 * @private
		 */
		_parseVariableDeclaration: function() {
			this._parseType();
			this._parseId();
		},

		/**
		 * WhileStatement ::== while BooleanExpr Block
		 *
		 * @private
		 */
		_parseWhileStatement: function() {

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_WHILE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_WHILE);
			}

			this.consumeToken();
			this._parseBooleanExpression();
			this._parseBlock();
		},

		/**
		 * IfStatement ::== if BooleanExpr Block
		 *
		 * @private
		 */
		_parseIfStatement: function() {

			var currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_IF)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_IF);
			}

			this.consumeToken();
			this._parseBooleanExpression();
			this._parseBlock();
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
					this._throwException(currentToken, '{name} is not the beginning of any expression.');
					break;
			}
		},

		/**
		 * IntExpr ::== digit intop Expr
		 * IntExpr ::== digit
		 *
		 * @private
		 */
		_parseIntExpression: function() {

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
		},

		/**
		 * StringExpr ::== CharList
		 *
		 * @private
		 */
		_parseStringExpression: function() {
			// Verify the current token is a quote
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
			currentToken = this.getCurrentToken();
			if(currentToken.get('type') !== Compiler.Token.T_QUOTE)
			{
				this._throwInvalidTokenFoundException(currentToken, Compiler.Token.T_QUOTE);
			}

			// The current token is a quote
			this.consumeToken();
		},

		/**
		 * BooleanExpr ::== ( Expr boolop Expr )
		 * BooleanExpr ::== boolval
		 *
		 * @private
		 */
		_parseBooleanExpression: function() {

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

			// Verify the current token is a character or white space
			var currentToken = this.getCurrentToken();
			if (currentToken.get('type') === Compiler.Token.T_CHAR
				|| currentToken.get('type') === Compiler.Token.T_WHITE_SPACE)
			{
				this.consumeToken();
				this._parseCharList();
			}
		},

		/**
		 * intop ::== +
		 *
		 * @private
		 */
		_parseIntOperator: function() {
			// Verify the current token a "+"
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
			throw errorMessage.replace("{name}", token.get('name')).replace("{line}", token.get('line'));
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

			throw errorMessage.replace("{name}", token.get('name')).replace("{line}", token.get('line'));
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
			return this.tokens[typeof index == 'undefined' ? this.currentTokenIndex : index];
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

			return this.tokens[nextTokenIndex];
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
			return this.tokens[this.currentTokenIndex];
		}
	});

	Compiler.Parser = Parser;

})(Backbone, Compiler);