/**
 * Classed used to represent a temp jump table entry.
 */

(function (Backbone, Compiler) {

	var TempJumpTableEntry = Backbone.Model.extend({
		defaults: {
			temp_name: null,
			id_name: null,
			scope: -1,
			address_offset: -1,
			address: null
		}
	});

	Compiler.TempJumpTableEntry = TempJumpTableEntry;

})(Backbone, Compiler);