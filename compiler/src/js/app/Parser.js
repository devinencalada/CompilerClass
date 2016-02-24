/**
 * Class used to represent the Parser. The parser class analyzes
 * The parser valid the code is made up of valid sentences.
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

		initialize: function(tokens) {
			this.tokens = tokens;
		},

		parse: function() {
			this._parseProgram();
			console.log(this.currentTokenIndex);
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

		_parseStatement: function() {

		},

		_parsePrintStatement: function() {

		},

		_parseAssignmentStatement: function() {

		},

		_parseVariableDeclaration: function() {

		},

		_parseWhileStatement: function() {

		},

		_parseIfStatement: function() {

		},

		_parseExpression: function() {

		},

		_parseIntExpression: function() {

		},

		_parseStringExpression: function() {

		},

		_parseBooleanExpression: function() {

		},

		_parseType: function() {

		},

		_parseId: function() {

		},

		_parseCharList: function() {

		},

		_parseIntOperator: function() {

		},

		_parseBooleanOperator: function() {

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
			var errorMessage = "Error on line {line}: " + message;
			throw errorMessage.replace("{name}", token.get('name')).replace("{line}", token.get('line'));
		},

		/**
		 * Throw exception according to the type of the
		 * specified token.
		 *
		 * @param {Compiler.Token} token
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

			throw "Error on line " + token.get('line') + ": Found " + token.get('name') + ", expected " + expectedToken.get('name') + ".";
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