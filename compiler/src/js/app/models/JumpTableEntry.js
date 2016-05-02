/**
 * Classed used to represent a jump table entry.
 */

(function (Backbone, Compiler) {

	var JumpTableEntry = Backbone.Model.extend({
		defaults: {
			temp_name: null,
			distance: -1
		}
	});

	Compiler.JumpTableEntry = JumpTableEntry;

})(Backbone, Compiler);