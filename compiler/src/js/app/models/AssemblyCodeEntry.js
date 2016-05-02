/**
 * Classed used to represent assembly code entries
 */

(function (Backbone, Compiler) {

	var AssemblyCodeEntry = Backbone.Model.extend({
		defaults: {
			code: null
		}
	});

	Compiler.AssemblyCodeEntry = AssemblyCodeEntry;

})(Backbone, Compiler);