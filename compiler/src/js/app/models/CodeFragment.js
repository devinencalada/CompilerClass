/**
 * Classed used to represent code fragments.
 * Code fragments contain attributes to store the code and the line number.
 */

(function (Backbone, Compiler) {

	var CodeFragment = Backbone.Model.extend({
		defaults: {
			code: null,
			line: null
		}
	});

	Compiler.CodeFragment = CodeFragment;

})(Backbone, Compiler);