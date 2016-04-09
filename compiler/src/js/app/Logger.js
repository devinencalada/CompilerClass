/**
 * Class used to log different types of
 * messages.
 */

(function (Backbone, Compiler) {

	var Logger = Backbone.Model.extend({

		/**
		 * @property {Backbone.Collection} logs
		 */
		logs: null,

		/**
		 * Initializes the logs collection
		 */
		initialize: function() {
			this.logs = new Backbone.Collection();
		},

		/**
		 *
		 * @param {String} message - Log message
		 * @param {Int} type - Log message type
		 * @param {Int} category - Log message category
		 * @param {Bool} verbose - Set to true or false
		 */
		log: function(message, type, category, verbose) {
			this.logs.add({
				message: message,
				type: type,
				category: category,
				verbose: verbose ? true : false
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
				return this.logs.length;
			}
			else if(type && !category)
			{
				return this.logs.where({
					type: type
				}).length;
			}
			else if(!type && category)
			{
				return this.logs.where({
					category: category
				}).length;
			}
			else
			{
				return this.logs.where({
					type: type,
					category: category
				}).length;
			}
		}

	});

	Compiler.Logger = new Logger();

	/**
	 * Log message types
	 */
	Compiler.Logger.ERROR = 1;
	Compiler.Logger.INFO = 2;
	Compiler.Logger.WARNING = 3;

	/**
	 * Log message categories
	 */
	Compiler.Logger.LEXER = 1;
	Compiler.Logger.PARSER = 2;


})(Backbone, Compiler);