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
		 */
		log: function(message, type, category) {
			this.logs.add({
				message: message,
				type: type,
				category: category
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
