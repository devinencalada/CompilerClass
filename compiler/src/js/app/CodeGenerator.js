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
		 * @property {Number} curr
		 */
		currIndex: 1,

		/**
		 * @property {Number} heap
		 */
		heapPointer: 1,

		/**
		 * @property {Compiler.AbstractSyntaxTree} ast
		 */
		ast: null,

		initialize: function(ast) {
			this.ast = ast;
			this.currIndex = 0;
			this.heapPointer = Compiler.CodeGenerator.MAX_CODE_SIZE;
			this.assemblyCode = new Compiler.AssemblyCode();
			this.jumpTable = new Compiler.JumpTable();
			this.tempJumpTable = new Compiler.TempJumpTable();

			for (var i = 0; i < Compiler.CodeGenerator.MAX_CODE_SIZE; i++)
			{
				this.assemblyCode.add(Compiler.CodeGenerator.NO_CODE);
			}
		}

	}, {
		MAX_CODE_SIZE: 256,
		NO_CODE: "00"
	});

	Compiler.CodeGenerator = CodeGenerator;

})(Backbone, Compiler);