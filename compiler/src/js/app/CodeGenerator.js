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
		},

		/**
		 * Resolves the entries in the jump table and temp jump table
		 * with their actual hex code values.
		 */
		resolveJumpEntries: function() {
			Compiler.Logger.log('Backpatching the code and resolving addresses', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

			var currCodeByte = '',
				staticIndex = this.assemblyCode.currIndex;

			for (var index = 0; index < staticIndex; index++)
			{
				currCodeByte = this.assemblyCode.at(index);

				// All temp jump table entries start with T
				if (/^T/.test(currCodeByte))
				{
					var tempTableEntry = this.tempJumpTable.at(parseInt(currCodeByte.substring(1), 10));
					var newIndex = staticIndex + tempTableEntry.get('address_offset');
					var hexLocation = Compiler.CodeGenerator.decimalToHex(newIndex);

					if (parseInt(hexLocation, 16) < this.assemblyCode.heapPointer)
					{
						Compiler.Logger.log('Resolving entry of ' + currCodeByte + ' to: ' + hexLocation + '.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						tempTableEntry.set('address', hexLocation);

						this.assemblyCode.setCodeAt(hexLocation, index);
						this.assemblyCode.setCodeAt('00', index + 1);
					}
					else
					{
						var errorMessage = 'Error! Static space is clashing with heap space (beginning at ' + Compiler.Utils.decimalToHex(this.heapPointer) + ') when ' + tempTableEntry.get('temp_name') + ' was resolved to address ' + hexLocation + '.';
						Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.CODE_GENERATOR);
						throw errorMessage;
					}
				}
				// All jump table entries start with J
				else if (/^J/.test(currCodeByte))
				{
					var jumpTableEntry = this.jumpTable.at(parseInt(currCodeByte.substring(1), 10));
					var distanceToJump = Compiler.Utils.decimalToHex(jumpTableEntry.get('distance'));

					Compiler.Logger.log('Resolving jump entry of ' + currCodeByte + ' to: ' + distanceToJump + '.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

					this.assemblyCode.setCodeAt(distanceToJump, index);
				}
			}
		},

		/**
		 * Adds the specified code to the heap.
		 *
		 * @param {String} strVal
		 * @param {Number} line
		 * @returns {number}
		 */
		addToHeap: function(strVal, line) {
			Compiler.Logger.log("Adding the string \"" + strVal + "\" on line " + line + " to the heap.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

			// Add null terminator
			strVal += "\0";

			var heapStartAddress = this.assemblyCode.heapPointer - strVal.length;

			// Check if heap clashes with static
			var staticEndAddress = this.assemblyCode.currIndex;

			if (heapStartAddress >= staticEndAddress)
			{
				for (var i = 0; i < strVal.length; i++)
				{
					var hexCode = Compiler.CodeGenerator.decimalToHex(strVal.charCodeAt(i));
					this.assemblyCode.setCodeAt(hexCode, heapStartAddress + i);
				}

				this.assemblyCode.heapPointer = heapStartAddress;
			}
			else
			{
				var errorMessage = "Error! Heap overflow occured when trying to add string \"" + strVal + "\" on line " + line + " around the address " + Compiler.CodeGenerator.decimalToHex(heapStartAddress) + '.';
				Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.CODE_GENERATOR);
				throw errorMessage;
			}

			return this.assemblyCode.heapPointer;
		}

	}, {
		MAX_CODE_SIZE: 256,
		NO_CODE: '00',

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