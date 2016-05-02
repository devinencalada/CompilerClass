/**
 * Classed used to represent a jump patch info entry.
 */

(function (Backbone, Compiler) {

	var JumpPatchEntry = Backbone.Model.extend({
		defaults: {
			temp_name: null,
			starting_address: -1
		}
	});

	Compiler.JumpPatchEntry = JumpPatchEntry;

})(Backbone, Compiler);