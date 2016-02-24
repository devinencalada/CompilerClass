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

		/**
		 * Returns the next token in the token list.
		 *
		 * @returns {Compiler.Token}
		 */
		getNextToken: function() {
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

});