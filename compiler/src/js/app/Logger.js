/**
 * Class used to log different types of
 * messages.
 */

(function (Backbone, Compiler) {

	var Logger = Backbone.Model.extend({

	}, {
		/**
		 * Log message type constants
		 */
		ERROR: 1,
		INFO: 2,
		WARNING: 3,

		/**
		 * Log message category constants
		 */
		LEXER: 1,
		PARSER: 2,
		SEMANTIC_ANALYSIS: 3,

		/**
		 *
		 * @param {String} message - Log message
		 * @param {Int} type - Log message type
		 * @param {Int} category - Log message category
		 * @param {Bool} verbose - Set to true or false
		 */
		log: function(message, type, category, verbose) {
			Logger.logs.add({
				message: message,
				type: type,
				category: category,
				verbose: verbose ? 1 : 0
			});
		},

		/**
		 * Returns the count of messages for the specified type and category.
		 *
		 * @param {Int} type - Log message type
		 * @param {Int} category - Log message category
		 */
		getCount: function(type, category) {
			if(!type && !category)
			{
				return Logger.logs.length;
			}
			else if(type && !category)
			{
				return Logger.logs.where({
					type: type
				}).length;
			}
			else if(!type && category)
			{
				return Logger.logs.where({
					category: category
				}).length;
			}
			else
			{
				return Logger.logs.where({
					type: type,
					category: category
				}).length;
			}
		}
	});

	Logger.logs = new Backbone.Collection();

	Compiler.Logger = Logger;

})(Backbone, Compiler);