/**
 * Class used to represent tokens found in the source code.
 * A token contains attributes to store the token type, code, token type name,
 * regular expression used to identify the token and the line number of where the
 * token is found in the code.
 */
 
 (function (Backbone, Compiler) {
	
	var Token = Backbone.Model.extend({
		 
		 defaults: {
			 type: Token.T_NO_MATCH,
			 code: null,
			 name: null,
			 regex: null,
			 line: null
		 },
		 
		 initialize: function(){
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
		 
		 
 }