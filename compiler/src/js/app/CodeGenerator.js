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
		NO_CODE: "00",

		/**
		 * Converts the secified decimal to hex.
		 * 0 Padding is added if necessary.
		 *
		 * @param {String} decimal
		 * @returns {string}
		 */
		decimalToHex: function(decimal) {
			var hex = decimal.toString(16);
			if (hex.length === 1)
			{
				hex = '0' + hex;
			}

			return hex.toUpperCase();
		}
	});

	Compiler.CodeGenerator = CodeGenerator;

})(Backbone, Compiler);