/**
 * Classed used to represent the code generator.
 */

(function (Backbone, Compiler) {

	var CodeGenerator = Backbone.Model.extend({

		/**
		 * @property {Backbone.Collection} tempJumpTable
		 */
		tempJumpTable: null,

		/**
		 * @property {Backbone.Collection} jumpTable
		 */
		jumpTable: null,

		/**
		 * @property {Backbone.Collection} assemblyCode
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
			this.assemblyCode = Backbone.Collection();
			this.jumpTable = Backbone.Collection();
			this.tempJumpTable = Backbone.Collection();

			for (var i = 0; i < Compiler.CodeGenerator.MAX_CODE_SIZE; i++)
			{
				this.assemblyCode.add(Compiler.CodeGenerator.CODE_PLACEHOLDER);
			}
		},

		/**
		 * Creates and adds to the jump table
		 * an instance of Compiler.JumpTableEntry.
		 *
		 * @returns {Compiler.JumpTableEntry}
		 */
		insertJumpTableEntry: function() {

			var entry = new Compiler.JumpTableEntry({
				temp_name: 'J' + this.jumpTable.length.toString()
			});

			this.jumpTable.add(entry);

			return entry;
		}

	}, {
		MAX_CODE_SIZE: 256,
		CODE_PLACEHOLDER: "00"
	});

	Compiler.CodeGenerator = CodeGenerator;

})(Backbone, Compiler);