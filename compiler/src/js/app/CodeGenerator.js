/**
 * Classed used to represent the code generator.
 */

(function (Backbone, Compiler) {

	var CodeGenerator = Backbone.Model.extend({

		/**
		 * @property {Compiler.TempJumpTable} tempJumpTable
		 */
		tempJumpTable: null,

		/**
		 * @property {Compiler.JumpTable} jumpTable
		 */
		jumpTable: null,

		/**
		 * @property {Compiler.AssemblyCode} assemblyCode
		 */
		assemblyCode: null,

		/**
		 * @property {Compiler.AbstractSyntaxTree} ast
		 */
		ast: null,

		initialize: function(ast) {
			this.ast = ast;
			this.assemblyCode = new Compiler.AssemblyCode();
			this.jumpTable = new Compiler.JumpTable();
			this.tempJumpTable = new Compiler.TempJumpTable();
		}

	}, {
		MAX_CODE_SIZE: 256,
		NO_CODE: "00"
	});

	Compiler.CodeGenerator = CodeGenerator;

})(Backbone, Compiler);