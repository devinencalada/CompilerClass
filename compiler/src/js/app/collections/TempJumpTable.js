/**
 * Collection used to represent the temp jump table
 */

(function (Backbone, Compiler) {

	var TempJumpTable = Collection.Model.extend({

		model: Compiler.TempJumpTableEntry

	});

	Compiler.TempJumpTable = TempJumpTable;

})(Backbone, Compiler);