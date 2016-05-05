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
		 * Translates a var declaration to assemblyCode code.
		 *
		 * @param {Compiler.TreeNode} node
		 */
		varDeclarationTmpl: function(node) {
			var idName = node.children[1].name,
				scope = node.children[1].symbolTableEntry.get('scope');

			Compiler.Logger.log('Inserting Declararation of id ' + idName + '.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

			// Load accumulator with 0
			this.assemblyCode.setCode(Compiler.CodeGenerator.ACCUMULATOR_CODE);
			this.assemblyCode.setCode('00');

			var entry = this.tempJumpTable.insertEntry();
			entry.set({
				id_name: idName,
				scope: scope
			});

			// Store accumulator at temp address of id.
			// The temp address will be replaced with the real value later on
			this.assemblyCode.setCode(Compiler.CodeGenerator.STORE_ACCUMULATOR_CODE);
			this.assemblyCode.setCode(entry.get('temp_name'));
			this.assemblyCode.setCode('XX');
		},

		/**
		 * Insert the Add with Carry instructions into code
		 * and returns the address of the sum's location.
		 */
		insertAddCode: function(locations) {
			// Set accumulator to 0 so you can start adding
			this.assemblyCode.setCode("A9");
			this.assemblyCode.setCode("00");

			while (locations.length > 0)
			{
				var address = locations.pop();

				var firstByte = address.split(" ")[0],
					secondByte = address.split(" ")[1];

				// Add contents of the address to the accumulator
				this.assemblyCode.setCode("6D");
				this.assemblyCode.setCode(firstByte);
				this.assemblyCode.setCode(secondByte);
			}

			// Create new entry for the location of the sum
			var entry = this.tempJumpTable.insertEntry();

			// Store the accumulator, now holding the sum, at an address in memory and return that address
			this.assemblyCode.setCode("8D");
			this.assemblyCode.setCode(entry.get('temp_name'));
			this.assemblyCode.setCode("XX");

			return entry.get('temp_name') + " " + "XX";
		},

		/**
		 * Adds up numbers and returns the addresses where the
		 * results are stored.
		 *
		 * @param {Compiler.TreeNode} node
		 * @return {Array} addresses
		 */
		insertAddLocations: function(node) {

			var addresses = [];

			function traverse(node)
			{
				if (node.isLeaf())
				{
					if (node.token.get('type') === Compiler.Token.T_ID)
					{
						// Get tempName of id
						var id = node.name,
							scope = node.symbolTableEntry.get('scope'),
							tempName = this.tempJumpTable.getEntryById(id, scope).get('temp_name');

						Compiler.Logger.log("Found id " + id + " to add.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						var address = tempName + " " + "XX";

						// Add address of tempName to list to be added together
						addresses.push(address);
					}
					else if (node.token.get('type') === Compiler.Token.T_DIGIT)
					{
						var intLiteral = "0" + node.name;

						// Load the accumulator with the int literal value
						this.assemblyCode.setCode("A9");
						this.assemblyCode.setCode(intLiteral);

						// Create new temp table entry for the int literal (inefficient, but it works)
						var entry = this.tempJumpTable.insertEntry();

						// Store the accumulator at a new temp address
						this.assemblyCode.setCode("8D");
						this.assemblyCode.setCode(entry.get('temp_name'));
						this.assemblyCode.setCode("XX");

						Compiler.Logger.log("Found digit " + intLiteral + " to add.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						var address = entry.get('temp_name') + " " + "XX";
						addresses.push(address);
					}
				}

				for (var i = 0; i < node.children.length; i++)
				{
					traverse(node.children[i]);
				}
			}

			return addresses;
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
		X_REGISTER_CODE: 'A2',
		ACCUMULATOR_CODE: 'A9',
		STORE_ACCUMULATOR_CODE: '8D',
		COMPARE_CODE: 'EC',
		BRANCH_BACK_CODE: 'D0',

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