/**
 * Collection used to represent the assembly code list
 */

(function (Backbone, Compiler) {

	var AssemblyCode = Collection.Model.extend({

		model: Compiler.AssemblyCodeEntry,

		heapPointer: 0,

		currIndex: 0,

		initialize: function() {
			this.heapPointer = Compiler.CodeGenerator.MAX_CODE_SIZE;

			for (var i = 0; i < Compiler.CodeGenerator.MAX_CODE_SIZE; i++)
			{
				this.add({code: Compiler.CodeGenerator.NO_CODE});
			}
		}
	});

	Compiler.AssemblyCode = AssemblyCode;

})(Backbone, Compiler);