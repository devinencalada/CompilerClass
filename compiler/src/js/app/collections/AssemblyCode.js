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
		},

		/**
		 * Insert the specified hex code.
		 *
		 * @param {String} input - Hex code
		 */
		setCode: function(input) {
			if ((this.currIndex + 1) <= this.heapPointer)
			{
				var entry = this.at(this.currIndex);
				entry.set('code', input);
				this.currIndex++;
			}
			else
			{
				var errorMessage = 'Error! Stack overflow at address ' + Compiler.CodeGenerator.decimalToHex(this.currIndex + 1) + ' when attempting to insert the code ' + input + '.';
				Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.CODE_GENERATOR);
				throw errorMessage;
			}
		},

		/**
		 * Insert hex code at the specified index.
		 *
		 * @param {String} input - Hex code
		 */
		setCodeAt: function(input, index) {
			if((index + 1) <= this.heapPointer)
			{
				var entry = this.at(index);
				entry.set('code', input);
			}
			else
			{
				var errorMessage = 'Error! Stack overflow at address ' + Compiler.CodeGenerator.decimalToHex(this.currIndex + 1) + ' when attempting to insert the code ' + input + '.';
				Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.CODE_GENERATOR);
				throw errorMessage;
			}
		}
	});

	Compiler.AssemblyCode = AssemblyCode;

})(Backbone, Compiler);