/**
 * Class used to represent tokens found in the source code.
 * A token contains attributes to store the token type, code, token type name,
 * regular expression used to identify the token and the line number of where the
 * token is found in the code.
 */

(function (Backbone, Compiler) {

	var Token = Backbone.Model.extend({

		defaults: {
			type: 0, // 'Default to T_NO_MATCH'
			code: null,
			name: null,
			regex: null,
			line: null
		},

		initialize: function() {
			this.setTokenAttributes();
		},

		/**
		 * Checks this token's code is valid for the type of token type.
		 *
		 * @returns {boolean}
		 */
		isValid: function() {
			return this.get('regex').test(this.get('code'));
		},

		/**
		 * Sets this model's token name and regular expression
		 * attributes.
		 */
		setTokenAttributes: function() {
			var attrs = {};

			switch(this.get('type'))
			{
				case Token.T_NO_MATCH:
					attrs.name = 'T_NO_MATCH';
					break
				case Token.T_DEFAULT:
					attrs.name = 'T_DEFAULT';
					break;
				case Token.T_LPAREN:
					attrs.name = 'T_LPAREN';
					attrs.regex = /^\($/;
					break;
				case Token.T_RPAREN:
					attrs.name = 'T_RPAREN';
					attrs.regex = /^\)$/;
					break;
				case Token.T_LBRACE:
					attrs.name = 'T_LBRACE';
					attrs.regex = /^\{$/;
					break;
				case Token.T_RBRACE:
					attrs.name = 'T_RBRACE';
					attrs.regex = /^\}$/;
					break;
				case Token.T_QUOTE:
					attrs.name = 'T_QUOTE';
					attrs.regex = /^"$/;
					break;
				case Token.T_PRINT:
					attrs.name = 'T_PRINT';
					attrs.regex = /^print$/;
					break;
				case Token.T_EOF:
					attrs.name = 'T_EOF';
					attrs.regex = /^\$$/;
					break;
				case Token.T_WHILE:
					attrs.name = 'T_WHILE';
					attrs.regex = /^while$/;
					break;
				case Token.T_IF:
					attrs.name = 'T_IF';
					attrs.regex = /^if$/;
					break;
				case Token.T_DIGIT:
					attrs.name = 'T_DIGIT';
					attrs.regex = /^[0-9]$/;
					break;
				case Token.T_ID:
					attrs.name = 'T_ID';
					attrs.regex = /^[a-z]$/;
					break;
				case Token.T_CHAR:
					attrs.name = 'T_CHAR';
					break;
				case Token.T_PLUS:
					attrs.name = 'T_PLUS';
					attrs.regex = /^\+$/;
					break;
				case Token.T_SPACE:
					attrs.name = 'T_SPACE';
					break;
				case Token.T_TYPE:
					attrs.name = 'T_TYPE';
					break;
				case Token.T_INT:
					attrs.name = 'T_INT';
					attrs.regex = /^int$/;
					break;
				case Token.T_STRING:
					attrs.name = 'T_STRING';
					attrs.regex = /^string$/;
					break;
				case Token.T_BOOLEAN:
					attrs.name = 'T_BOOLEAN';
					attrs.regex = /^boolean$/;
					break;
				case Token.T_SINGLE_EQUALS:
					attrs.name = 'T_SINGLE_EQUALS';
					attrs.regex = /^=$/;
					break;
				case Token.T_DOUBLE_EQUALS:
					attrs.name = 'T_DOUBLE_EQUALS';
					attrs.regex = /^==$/;
					break;
				case Token.T_NOT_EQUALS:
					attrs.name = 'T_NOT_EQUALS';
					attrs.regex = /^!=$/;
					break;
				case Token.T_EXCLAMATION_POINT:
					attrs.name = 'T_EXCLAMATION_POINT';
					attrs.regex = /^!$/;
					break;
				case Token.T_FALSE:
					attrs.name = 'T_FALSE';
					attrs.regex = /^false$/;
					break;
				case Token.T_TRUE:
					attrs.name = 'T_TRUE';
					attrs.regex = /^true$/;
					break;
				case Token.T_WHITE_SPACE:
					attrs.name = 'T_WHITE_SPACE';
					attrs.regex = /^[\s|\n]$/;
					break;
				case Token.T_STRING_EXPRESSION:
					attrs.name = 'T_STRING_EXPRESSION';
					break;
			}

			this.set(attrs);
		}

	}, {
		/**
		 * Token type constants
		 */
		T_NO_MATCH: 0,
		T_DEFAULT: 1,
		T_LPAREN: 2,
		T_RPAREN: 3,
		T_LBRACE: 4,
		T_RBRACE: 5,
		T_QUOTE: 6,
		T_PRINT: 7,
		T_EOF: 8,
		T_WHILE: 9,
		T_IF: 10,
		T_DIGIT: 11,
		T_ID: 12,
		T_CHAR: 13,
		T_PLUS: 14,
		T_SPACE: 15,
		T_TYPE: 16,
		T_INT: 17,
		T_STRING: 18,
		T_BOOLEAN: 19,
		T_SINGLE_EQUALS: 20,
		T_DOUBLE_EQUALS: 21,
		T_NOT_EQUALS: 22,
		T_EXCLAMATION_POINT: 23,
		T_FALSE: 24,
		T_TRUE: 25,
		T_WHITE_SPACE: 26,
		T_STRING_EXPRESSION: 27,

		/**
		 * Returns an instance of Compiler.Token if the
		 * specified codeFragment is of a valid token type.
		 *
		 * @param {Compiler.CodeFragment} codeFragment
		 * @returns {null|Compiler.Token}
		 */
		getTokenFromCodeFragment: function(codeFragment) {
			var token = new Token();

			// Iterate over all the token types
			for (var i = 0; i < 27; i++)
			{
				token.set({
					type: i,
					code: codeFragment.get('code'),
					line: codeFragment.get('line')
				});

				token.setTokenAttributes();

				if (token.get('regex') && token.isValid())
				{
					return token;
				}
			}

			return null;
		},

		/**
		 * Returns and instance of Compiler.Token for the
		 * specified token type.
		 *
		 * @param {Number} type
		 * @returns {Compiler.Token}
		 */
		getTokenByType: function(type) {
			return new Token({
				type: type
			});
		}
	});

	Compiler.Token = Token;

})(Backbone, Compiler);