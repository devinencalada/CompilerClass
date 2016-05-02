/**
 * Classed used to represent the code generator.
 */

(function (Backbone, Compiler) {

	var CodeGenerator = Backbone.Model.extend({

	}, {
		MAX_CODE_SIZE: 256
	});

	Compiler.CodeGenerator = CodeGenerator;

})(Backbone, Compiler);