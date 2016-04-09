/**
 * Class used to log different types of
 * messages.
 */

(function (Backbone, Compiler) {

	var Logger = Backbone.Model.extend({

	}, {
		/**
		 * Log message types
		 */
		ERROR: 1,
		INFO: 2,
		WARNING: 3,

		/**
		 * Log message categories
		 */
		LEXER: 1,
		PARSER: 2
	});

	Compiler.Logger = Logger;

})(Backbone, Compiler);
