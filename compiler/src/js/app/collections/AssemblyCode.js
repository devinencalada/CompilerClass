/**
 * Collection used to represent the assembly code list
 */

(function (Backbone, Compiler) {

	var AssemblyCode = Collection.Model.extend({

		model: Compiler.AssemblyCodeEntry
	});

	Compiler.AssemblyCode = AssemblyCode;

})(Backbone, Compiler);

// Collection used to store the assembly code entries