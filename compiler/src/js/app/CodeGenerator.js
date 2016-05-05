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
		 * Traverses the AST to create the entries in the
		 * assembly code collection.
		 */
		generateMachineCode: function() {

			var cg = this;

			function traverse(node)
			{
				var inBlock = false,
					jumpPatchEntry = null,
					jumpBackIndex = -1;

				switch (node.name)
				{
					case Compiler.AbstractSyntaxTree.VAR_DECLARATION_NODE:
						cg.varDeclarationTmpl(node);
						break;

					case Compiler.AbstractSyntaxTree.ASSIGNMENT_STATEMENT_NODE:
						cg.assignmentDeclarationTmpl(node);
						break;

					case Compiler.AbstractSyntaxTree.PRINT_STATEMENT_NODE:
						cg.printStatementTmpl(node);
						break;

					case Compiler.AbstractSyntaxTree.IF_STATEMENT_NODE:
						var leftChild = node.children[0];
						jumpPatchEntry = cg.evaluateBooleanCondition(leftChild);
						inBlock = true;
						break;

					case Compiler.AbstractSyntaxTree.WHILE_STATEMENT_NODE:
						jumpBackIndex = cg.assemblyCode.currIndex;

						var leftChild = node.children[0];
						jumpPatchEntry = cg.evaluateBooleanCondition(leftChild);

						inBlock = true;

						break;

					default:
						break;
				}

				// Recursively traverse the current node's children
				for (var i = 0; i < node.children.length; i++)
				{
					traverse(node.children[i]);
				}

				// Set reference to the jump address so that they can be replaced later
				if (inBlock)
				{
					// Set the reference for the while jump distance
					if (jumpBackIndex !== -1)
					{
						// Load X register with 0
						cg.assemblyCode.setCode(Compiler.CodeGenerator.X_REGISTER_CODE);
						cg.assemblyCode.setCode('00');

						// Store 1 in the temp jump table so we can reference back
						var tempEntry = cg.tempJumpTable.insertEntry();

						// Load accumulator with 1
						cg.assemblyCode.setCode(Compiler.CodeGenerator.ACCUMULATOR_CODE);
						cg.assemblyCode.setCode('01');

						// Store accumulator at address of conditional result
						cg.assemblyCode.setCode(Compiler.CodeGenerator.STORE_ACCUMULATOR_CODE);
						cg.assemblyCode.setCode(tempEntry.get('temp_name'));
						cg.assemblyCode.setCode('XX');

						// Compare X Register (0) and Temp Entry (1)
						cg.assemblyCode.setCode(Compiler.CodeGenerator.COMPARE_CODE);
						cg.assemblyCode.setCode(tempEntry.get('temp_name'));
						cg.assemblyCode.setCode('XX');

						var jumpBackEntry = cg.jumpTable.insertEntry();

						// Branch back to re-start the while loop
						cg.assemblyCode.setCode(Compiler.CodeGenerator.BRANCH_BACK_CODE);
						cg.assemblyCode.setCode(jumpBackEntry.get('temp_name'));

						jumpBackEntry.set('distance', (Compiler.CodeGenerator.MAX_CODE_SIZE - (cg.assemblyCode.currIndex - jumpBackIndex)));
					}

					// Set the proper distance to jump for failed conditional
					var substringIndex = parseInt(jumpPatchEntry.get('temp_name').substring(1), 10);

					var jumpEntry = cg.jumpTable.at(substringIndex);
					jumpEntry.set('distance', cg.assemblyCode.currIndex - jumpPatchEntry.get('starting_address'));

					inBlock = false;
				}
			}

			traverse(cg.ast.root);
		},

		/**
		 * Translates an assignment declaration to assemblyCode code.
		 *
		 * @param {Compiler.TreeNode} node
		 */
		assignmentDeclarationTmpl: function(node) {
			var idNode = node.children[0];
			var id = idNode.name;
			var idType = node.token ? node.token.get('type') : null;

			if(idType === Compiler.Token.T_DIGIT)
			{
				var rightChild = node.children[1];

				if (rightChild.isLeaf())
				{
					var value = rightChild.name;

					// Assigning a digit
					if (rightChild.token.get('type') === Compiler.Token.T_DIGIT)
					{
						Compiler.Logger.log("Inserting Integer Assignment of " + value + " to id " + id + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						// Pad, as we can only have single digit literals
						value = "0" + value;

						// Load the accumulator with the value being stored
						this.assemblyCode.setCode("A9");
						this.assemblyCode.setCode(value);

						var scope = idNode.symbolTableEntry.get('scope');
						var tempName = this.tempJumpTable.getEntryById(id, scope);

						// Store the accumulator at the address of the id
						this.assemblyCode.setCode("8D");
						this.assemblyCode.setCode(tempName.get('temp_name'));
						this.assemblyCode.setCode("XX");
					}
					else if (rightChild.token.get('type') === Compiler.Token.T_ID)
					{
						Compiler.Logger.log("Inserting Integer Assignment of id " + value + " to id " + id + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						var rhsId = rightChild.name;
						var rhsScope = rightChild.symbolTableEntry.get('scope');
						var rhsTempName = this.tempJumpTable.getEntryById(rhsId, rhsScope);

						// Load the data at the address of the RHS id into the accumulator
						this.assemblyCode.setCode("AD");
						this.assemblyCode.setCode(rhsTempName.get('temp_name'));
						this.assemblyCode.setCode("XX");

						var lhsScope = idNode.symbolTableEntry.get('scope');
						var lhsTempName = this.tempJumpTable.getEntryById(id, lhsScope);

						// Store the data in the accumulator at the address of the LHS id
						this.assemblyCode.setCode("8D");
						this.assemblyCode.setCode(lhsTempName.get('temp_name'));
						this.assemblyCode.setCode("XX");
					}
				}
				else
				{
					Compiler.Logger.log("Inserting Integer Assignment of addition result to id " + id + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

					var addressesToAdd = this.insertAddLocations(rightChild);

					var addressOfSum = this.insertAddCode(addressesToAdd);
					var firstByte = addressOfSum.split(" ")[0];
					var secondByte = addressOfSum.split(" ")[1];

					// Load contents of the address of the sum to accumulator
					this.assemblyCode.setCode("AD");
					this.assemblyCode.setCode(firstByte);
					this.assemblyCode.setCode(secondByte);

					var lhsScope = idNode.symbolTableEntry.get('scope');
					var tempName = this.tempJumpTable.getEntryById(id, lhsScope);

					// Store contents of the accumulator (containing sum of addition) in address of LHS id
					this.assemblyCode.setCode("8D");
					this.assemblyCode.setCode(tempName.get('temp_name'));
					this.assemblyCode.setCode("XX");
				}
			}
			else if (idType === Compiler.Token.T_TRUE
				|| idType === Compiler.Token.T_FALSE)
			{
				var rightChild = node.children[1];

				if (rightChild.isLeaf())
				{
					// Assigning true
					if (rightChild.token.get('type') === Compiler.Token.T_TRUE)
					{
						Compiler.Logger.log("Inserting Boolean Assignment of Literal True to id " + id + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						// Load the accumulator with the value of 1 (for true)
						this.assemblyCode.setCode("A9");
						this.assemblyCode.setCode("01");

						var scope = idNode.symbolTableEntry.get('scope');
						var tempName = this.tempJumpTable.getEntryById(id, scope);

						// Store the value of 1 (true) at the address of the id
						this.assemblyCode.setCode("8D");
						this.assemblyCode.setCode(tempName.get('temp_name'));
						this.assemblyCode.setCode("XX");
					}
					else if (rightChild.token.get('type') === Compiler.Token.T_FALSE)
					{
						Compiler.Logger.log("Inserting Boolean Assignment of Literal False to id " + id + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						// Load the accumulator with the value of 0 (for false)
						this.assemblyCode.setCode("A9");
						this.assemblyCode.setCode("00");

						var scope = idNode.symbolTableEntry.get('scope');
						var tempName = this.tempJumpTable.getEntryById(id, scope);

						// Store the value of 0 (false) at the address of the id
						this.assemblyCode.setCode("8D");
						this.assemblyCode.setCode(tempName.get('temp_name'));
						this.assemblyCode.setCode("XX");
					}
					else if (rightChild.token.get('type') === Compiler.Token.T_ID)
					{
						var rhsId = rightChild.name;
						var rhsScope = rightChild.symbolTableEntry.get('scope');
						var rhsTempName = this.tempJumpTable.getEntryById(rhsId, rhsScope);

						Compiler.Logger.log("Inserting Boolean Assignment of id " + rhsId + " to id " + id + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						// Load the data at the address of the RHS id into the accumulator
						this.assemblyCode.setCode("AD");
						this.assemblyCode.setCode(rhsTempName.get('temp_name'));
						this.assemblyCode.setCode("XX");

						var lhsScope = idNode.symbolTableEntry.get('scope');
						var lhsTempName = this.tempJumpTable.getEntryById(id, lhsScope);

						// Store the data in the accumulator at the address of the LHS id
						this.assemblyCode.setCode("8D");
						this.assemblyCode.setCode(lhsTempName.get('temp_name'));
						this.assemblyCode.setCode("XX");
					}
				}
				else
				{
					Compiler.Logger.log("Inserting Boolean Assignment of Boolean Expression to id " + id + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

					var addressOfResult = this.parseBooleanExpression(rightChild);

					var resultFirstByte = addressOfResult.split(" ")[0];
					var resultSecondByte = addressOfResult.split(" ")[1];

					// Load accumulator with address of result
					this.assemblyCode.setCode("AD");
					this.assemblyCode.setCode(resultFirstByte);
					this.assemblyCode.setCode(resultSecondByte);

					var lhsScope = idNode.symbolTableEntry.get('scope');
					var lhsTempName = this.tempJumpTable.getEntryById(id, lhsScope);

					// Store accumulator at address of id in assignment
					this.assemblyCode.setCode("8D");
					this.assemblyCode.setCode(lhsTempName.get('temp_name'));
					this.assemblyCode.setCode("XX");
				}
			}
			else
			{
				var leftChild = node.children[0];
				var rightChild = node.children[1];

				// Assigning a string literal
				if (rightChild.token && rightChild.token.get('type') === Compiler.Token.T_STRING_EXPRESSION)
				{
					var id = leftChild.name;
					var value = rightChild.name;
					var lineNumber = rightChild.token.get('line');

					Compiler.Logger.log("Inserting String Assignment of id " + id + " to string \"" + value + "\".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

					var startAddress = Compiler.CodeGenerator.decimalToHex(this.addToHeap(value, lineNumber));

					var scope = leftChild.symbolTableEntry.get('scope');
					var tempName = this.tempJumpTable.getEntryById(id, scope);

					// Load accumulator with the address of the string
					this.assemblyCode.setCode("A9");
					this.assemblyCode.setCode(startAddress);

					// Store the value of the accumulator at the address of the string variable
					this.assemblyCode.setCode("8D");
					this.assemblyCode.setCode(tempName.get('temp_name'));
					this.assemblyCode.setCode("XX");
				}
				else if (rightChild.token && rightChild.token.get('type') === Compiler.Token.T_ID)
				{
					var lhsId = leftChild.name;
					var lhsScope = leftChild.symbolTableEntry.get('scope');
					var lhsTempName = this.tempJumpTable.getEntryById(lhsId, lhsScope);

					var rhsId = rightChild.name;
					var rhsScope = rightChild.symbolTableEntry.get('scope');
					var rhsTempName = this.tempJumpTable.getEntryById(rhsId, rhsScope);

					Compiler.Logger.log("Inserting String Assignment of id " + rhsId + " to id " + lhsId + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

					// Load accumulator with the address of the RHS string
					this.assemblyCode.setCode("AD");
					this.assemblyCode.setCode(rhsTempName.get('temp_name'));
					this.assemblyCode.setCode("XX");

					// Store value in accumulator as the address of the LHS string
					this.assemblyCode.setCode("8D");
					this.assemblyCode.setCode(lhsTempName.get('temp_name'));
					this.assemblyCode.setCode("XX");
				}
			}
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
		 * Translates a print statement to assemblyCode code.
		 *
		 * @param {Compiler.TreeNode} node
		 */
		printStatementTmpl: function(node) {
			var firstChild = node.children[0];

			// Integer addition
			if (firstChild.name === Compiler.AbstractSyntaxTree.ADD_NODE)
			{
				Compiler.Logger.log('Inserting Print Statement of Integer Addition.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				var addressesToAdd = this.insertAddLocations(firstChild);
				var addressOfSum = this.insertAddCode(addressesToAdd);
				var firstByte = addressOfSum.split(" ")[0];
				var secondByte = addressOfSum.split(" ")[1];

				// Load Y register with the number being printed
				this.assemblyCode.setCode("AC");
				this.assemblyCode.setCode(firstByte);
				this.assemblyCode.setCode(secondByte);

				// Load 1 into X register to get ready to print an int
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// System call
				this.assemblyCode.setCode("FF");
			}
			else if (firstChild.name === Compiler.AbstractSyntaxTree.EQUAL_NODE
				|| firstChild.name === Compiler.AbstractSyntaxTree.NOT_EQUAL_NODE)
			{
				Compiler.Logger.log('Inserting Print Statement of Boolean Expression', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				var addressOfResult = this.parseBooleanExpression(firstChild);

				var firstByte = addressOfResult.split(" ")[0];
				var secondByte = addressOfResult.split(" ")[1];

				// Load X register with 1 to get ready to print int (same representation as true / false)
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// Load Y register with address of result of the boolean operation
				this.assemblyCode.setCode("AC");
				this.assemblyCode.setCode(firstByte);
				this.assemblyCode.setCode(secondByte);

				// System call
				this.assemblyCode.setCode("FF");
			}
			else if (firstChild.token.get('type') === Compiler.Token.T_DIGIT)
			{
				Compiler.Logger.log('Inserting Print Statement of Integer Literal ' + firstChild.name + '.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				// Pad digit with 0 (digits range from 0-9 only)
				var digitToPrint = "0" + firstChild.name;

				// Load the Y register with the digit being printed
				this.assemblyCode.setCode("A0");
				this.assemblyCode.setCode(digitToPrint);

				// Load 1 into X register to get ready to print an int
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// System call
				this.assemblyCode.setCode("FF");
			}
			else if (firstChild.token.get('type') === Compiler.Token.T_ID)
			{
				Compiler.Logger.log('Inserting Print Statement of id with type ' + firstChild.symbolTableEntry.get('type') + '.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				var id = firstChild.name,
					scope = firstChild.symbolTableEntry.get('scope'),
					tempName = this.tempJumpTable.getEntryById(id, scope);

				// Load the Y register from the memory address of the id
				this.assemblyCode.setCode("AC");
				this.assemblyCode.setCode(tempName.get('temp_name'));
				this.assemblyCode.setCode("XX");

				var type = firstChild.token.get('type');

				// Load 1 into X register to get ready to print an int / boolean
				if (type === Compiler.Token.T_INT
					|| type === Compiler.Token.T_BOOLEAN)
				{
					this.assemblyCode.setCode("A2");
					this.assemblyCode.setCode("01");
				}
				else
				{
					this.assemblyCode.setCode("A2");
					this.assemblyCode.setCode("02");
				}

				// System call
				this.assemblyCode.setCode("FF");
			}
			else if (firstChild.token.get('type') === Compiler.Token.T_TRUE)
			{
				Compiler.Logger.log('Inserting Print Statement of Literal True.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				// True is equivalent to 1
				var digitToPrint = "01";

				// Load the Y register with the digit being printed
				this.assemblyCode.setCode("A0");
				this.assemblyCode.setCode(digitToPrint);

				// Load 1 into X register to get ready to print an int
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// System call
				this.assemblyCode.setCode("FF");
			}
			else if (firstChild.token.get('type') === Compiler.Token.T_FALSE)
			{
				Compiler.Logger.log('Inserting Print Statement of Literal False.', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				// False is equivalent to 0
				var digitToPrint = "00";

				// Load the Y register with the digit being printed
				this.assemblyCode.setCode("A0");
				this.assemblyCode.setCode(digitToPrint);

				// Load 1 into X register to get ready to print an int
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// System call
				this.assemblyCode.setCode("FF");
			}
			else if (firstChild.token.get('type') === Compiler.Token.T_STRING_EXPRESSION)
			{
				var valueToPrint = firstChild.name,
					line = firstChild.get('line');

				Compiler.Logger.log('Inserting Print Statement of Literal String "' + valueToPrint + '".', Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				var hexAddress = Compiler.CodeGenerator.decimalToHex(this.addToHeap(valueToPrint, line));

				// Load the Y register with the starting address of the string being printed
				this.assemblyCode.setCode("A0");
				this.assemblyCode.setCode(hexAddress);

				// Load 2 into X register to get ready to print a string
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("02");

				// System call
				this.assemblyCode.setCode("FF");
			}
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

			var cg = this,
				addresses = [];

			function traverse(node)
			{
				if (node.isLeaf())
				{
					if (node.token && node.token.get('type') === Compiler.Token.T_ID)
					{
						// Get tempName of id
						var id = node.name,
							scope = node.symbolTableEntry.get('scope'),
							tempName = cg.tempJumpTable.getEntryById(id, scope);

						Compiler.Logger.log("Found id " + id + " to add.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

						var address = tempName.get('temp_name') + " " + "XX";

						// Add address of tempName to list to be added together
						addresses.push(address);
					}
					else if (node.token && node.token.get('type') === Compiler.Token.T_DIGIT)
					{
						var intLiteral = "0" + node.name;

						// Load the accumulator with the int literal value
						cg.assemblyCode.setCode("A9");
						cg.assemblyCode.setCode(intLiteral);

						// Create new temp table entry for the int literal (inefficient, but it works)
						var entry = cg.tempJumpTable.insertEntry();

						// Store the accumulator at a new temp address
						cg.assemblyCode.setCode("8D");
						cg.assemblyCode.setCode(entry.get('temp_name'));
						cg.assemblyCode.setCode("XX");

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
		 * Returns the address of the beginning of the boolean block
		 * so that we can backpatch jump code.
		 */
		evaluateBooleanCondition: function(node) {
			Compiler.Logger.log("Evaluating condition for if / while statement.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

			if(node.token && node.token.get('type') === Compiler.Token.T_TRUE)
			{
				Compiler.Logger.log("Condition of if / while statement is true.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				// Load accumulator with 1 (true)
				this.assemblyCode.setCode("A9");
				this.assemblyCode.setCode("01");

				var tempEntry = this.tempJumpTable.insertEntry();

				// Store the accumulator at an address in memory to be compared against
				this.assemblyCode.setCode("8D");
				this.assemblyCode.setCode(tempEntry.get('temp_name'));
				this.assemblyCode.setCode("XX");

				// Load X register with 1 (true)
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// Compare X register and address in memory (1 == 1, so Z-flag is set to 1)
				this.assemblyCode.setCode("EC");
				this.assemblyCode.setCode(tempEntry.get('temp_name'));
				this.assemblyCode.setCode("XX");

				var jumpEntry = this.jumpTable.insertEntry();

				// Z-flag will be set to 1, so it won't branch
				this.assemblyCode.setCode("D0");
				this.assemblyCode.setCode(jumpEntry.get('temp_name'));

				var jumpInfo = new Compiler.JumpPatchEntry({
					temp_name: jumpEntry.get('temp_name'),
					starting_address: this.assemblyCode.currIndex
				});

				return jumpInfo;
			}
			else if(node.token && node.token.get('type') === Compiler.Token.T_FALSE)
			{
				Compiler.Logger.log("Condition of if / while statement is false.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				// Load accumulator with 0 (false)
				this.assemblyCode.setCode("A9");
				this.assemblyCode.setCode("00");

				var tempEntry = this.tempJumpTable.insertEntry();

				// Store the accumulator at an address in memory to be compared against
				this.assemblyCode.setCode("8D");
				this.assemblyCode.setCode(tempEntry.get('temp_name'));
				this.assemblyCode.setCode("XX");

				// Load X register with 1 (true)
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// Compare X register and address in memory (0 != 1, so Z-flag is set to 0)
				this.assemblyCode.setCode("EC");
				this.assemblyCode.setCode(tempEntry.get('temp_name'));
				this.assemblyCode.setCode("XX");

				var jumpEntry = this.jumpTable.insertEntry();

				// Z-flag will be set to 0, so we will always branch
				this.assemblyCode.setCode("D0");
				this.assemblyCode.setCode(jumpEntry.get('temp_name'));

				var jumpInfo = new Compiler.JumpPatchEntry({
					temp_name: jumpEntry.get('temp_name'),
					starting_address: this.assemblyCode.currIndex
				});

				return jumpInfo;
			}
			else if(node.isBranch())
			{
				Compiler.Logger.log("Condition of if / while statement is a Boolean Expression.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

				var addressOfResult = this.parseBooleanExpression(node);

				var firstByte = addressOfResult.split(" ")[0];
				var secondByte = addressOfResult.split(" ")[1];

				// Load the X register with 1 for comparison (true condition will execute loop)
				this.assemblyCode.setCode("A2");
				this.assemblyCode.setCode("01");

				// Compare X register with address of the result of the boolean condition
				this.assemblyCode.setCode("EC");
				this.assemblyCode.setCode(firstByte);
				this.assemblyCode.setCode(secondByte);

				var jumpEntry = this.jumpTable.insertEntry();

				// Branch not equal around block of while / if
				this.assemblyCode.setCode("D0");
				this.assemblyCode.setCode(jumpEntry.get('temp_name'));

				var jumpInfo = new Compiler.JumpPatchEntry({
					temp_name: jumpEntry.get('temp_name'),
					starting_address: this.assemblyCode.currIndex
				});

				return jumpInfo;
			}
		},

		/**
		 * Parses the boolean expression node and
		 * returns the address of result.
		 *
		 * @param {Compiler.TreeNode} node
		 * @returns {String}
		 */
		parseBooleanExpression: function(node) {
			var cg = this;

			function traverse(node)
			{
				var resultAddress = "";

				if(node)
				{
					var leftAddress = '',
						rightAddress = '';

					if(node.isBranch())
					{
						leftAddress = traverse(node.children[0]);
						rightAddress = traverse(node.children[1]);

						if(leftAddress !== "" && rightAddress !== "")
						{
							var leftFirstByte = leftAddress.split(" ")[0],
								leftSecondByte = leftAddress.split(" ")[1];

							var rightFirstByte = rightAddress.split(" ")[0],
								rightSecondByte = rightAddress.split(" ")[1];

							// Load the X register with the left address
							cg.assemblyCode.setCode("AE");
							cg.assemblyCode.setCode(leftFirstByte);
							cg.assemblyCode.setCode(leftSecondByte);

							// Compare the right against the left address
							cg.assemblyCode.setCode("EC");
							cg.assemblyCode.setCode(rightFirstByte);
							cg.assemblyCode.setCode(rightSecondByte);

							if(node.name === Compiler.AbstractSyntaxTree.EQUAL_NODE)
							{
								Compiler.Logger.log("Evaluating if " + leftFirstByte + " == " + rightFirstByte + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

								// Result address
								var tempEntry = cg.tempJumpTable.insertEntry(),
									jumpEntryNotEqual = cg.jumpTable.insertEntry(),
									jumpEntryEqual = cg.jumpTable.insertEntry();

								cg.jumpTable.add(jumpEntryNotEqual);
								cg.jumpTable.add(jumpEntryEqual);

								// Store 0 in the result address as default
								// Load accumulator with 0
								cg.assemblyCode.setCode("A9");
								cg.assemblyCode.setCode("00");

								// Store the accumulator at result address
								cg.assemblyCode.setCode("8D");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								// Branch around if z = 0 (true == false or false == true)
								cg.assemblyCode.setCode("D0");
								cg.assemblyCode.setCode(jumpEntryNotEqual.get('temp_name'));

								var firstJumpIndex = cg.assemblyCode.currIndex;

								// Case where true == true or false == false; both evaluate to true
								// Load accumulator with 1 (true)
								cg.assemblyCode.setCode("A9");
								cg.assemblyCode.setCode("01");

								// Store accumulator at temp address
								cg.assemblyCode.setCode("8D");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								// Set distance to jump after branch not equal
								jumpEntryNotEqual.set('distance', cg.assemblyCode.currIndex - firstJumpIndex);

								// Set up for next jump
								// Load X register with 0
								cg.assemblyCode.setCode("A2");
								cg.assemblyCode.setCode("00");

								// Compare X register and result address
								cg.assemblyCode.setCode("EC");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								// Branch around if z = 0 (If we did above case, where true == true or false == false)
								cg.assemblyCode.setCode("D0");
								cg.assemblyCode.setCode(jumpEntryEqual.get('temp_name'));

								var secondJumpIndex = cg.assemblyCode.currIndex;

								// Case where true == false or false == true; both evaluate to false
								// Load accumulator with 0 (false)
								cg.assemblyCode.setCode("A9");
								cg.assemblyCode.setCode("00");

								// Store accumulator at temp address
								cg.assemblyCode.setCode("8D");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								jumpEntryEqual.set('distance', cg.assemblyCode.currIndex - secondJumpIndex);

								resultAddress = tempEntry.get('temp_name') + " " + "XX";
							}
							else if (node.name === Compiler.AbstractSyntaxTree.NOT_EQUAL_NODE)
							{
								Compiler.Logger.log("Evaluating if " + leftFirstByte + " != " + rightFirstByte + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

								// Result address
								var tempEntry = cg.tempJumpTable.insertEntry(),
									jumpEntryNotEqual = cg.jumpTable.insertEntry(),
									jumpEntryEqual = cg.jumpTable.insertEntry();

								cg.jumpTable.add(jumpEntryNotEqual);
								cg.jumpTable.add(jumpEntryEqual);

								// Store 1 in the result address as default
								// Load accumulator with 1
								cg.assemblyCode.setCode("A9");
								cg.assemblyCode.setCode("01");

								// Store the accumulator at result address
								cg.assemblyCode.setCode("8D");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								// Branch around if z = 0 (true != false or false != true)
								cg.assemblyCode.setCode("D0");
								cg.assemblyCode.setCode(jumpEntryNotEqual.get('temp_name'));

								var firstJumpIndex = cg.assemblyCode.currIndex;

								// Case where true != true or false != false; both evaluate to false
								// Load accumulator with 0 (false)
								cg.assemblyCode.setCode("A9");
								cg.assemblyCode.setCode("00");

								// Store accumulator at temp address
								cg.assemblyCode.setCode("8D");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								// Set distance to jump after branch not equal
								jumpEntryNotEqual.set('distance', cg.assemblyCode.currIndex - firstJumpIndex);

								// Set up for next jump
								// Load X register with 1
								cg.assemblyCode.setCode("A2");
								cg.assemblyCode.setCode("01");

								// Compare X register and result address
								cg.assemblyCode.setCode("EC");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								// Branch around if z = 0 (If we did above case, where true != true or false != false)
								cg.assemblyCode.setCode("D0");
								cg.assemblyCode.setCode(jumpEntryEqual.get('temp_name'));

								var secondJumpIndex = cg.assemblyCode.currIndex;

								// Case where true != false or false != true; both evaluate to true
								// Load accumulator with 1 (true)
								cg.assemblyCode.setCode("A9");
								cg.assemblyCode.setCode("01");

								// Store accumulator at temp address
								cg.assemblyCode.setCode("8D");
								cg.assemblyCode.setCode(tempEntry.get('temp_name'));
								cg.assemblyCode.setCode("XX");

								jumpEntryEqual.set('distance', cg.assemblyCode.currIndex - secondJumpIndex);

								resultAddress = tempEntry.get('temp_name') + " " + "XX";
							}
							else if (node.name === Compiler.AbstractSyntaxTree.ADD_NODE)
							{
								var addressesToAdd = cg.insertAddLocations(node);
								var addressOfSum = cg.insertAddCode(addressesToAdd);

								resultAddress = addressOfSum + " " + "XX";
							}
						}
					}
					else if(node.isLeaf())
					{
						if(node.token && node.token.get('type') === Compiler.Token.T_DIGIT)
						{
							Compiler.Logger.log("Propagating addresss of Int literal " + node.name + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

							// Load accumulator with value of digit
							cg.assemblyCode.setCode("A9");
							cg.assemblyCode.setCode("0" + node.name);

							var tempEntry = cg.tempJumpTable.insertEntry();

							// Store the accumulator at a temp address
							cg.assemblyCode.setCode("8D");
							cg.assemblyCode.setCode(tempEntry.get('temp_name'));
							cg.assemblyCode.setCode("XX");

							resultAddress = tempEntry.get('temp_name') + " " + "XX";
						}
						else if(node.token && node.token.get('type') === Compiler.Token.T_TRUE)
						{
							Compiler.Logger.log("Propagating addresss of Literal true.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

							// Load the accumulator with 1 (true)
							cg.assemblyCode.setCode("A9");
							cg.assemblyCode.setCode("01");

							var tempEntry = cg.tempJumpTable.insertEntry();

							// Store the accumulator at a temp address
							cg.assemblyCode.setCode("8D");
							cg.assemblyCode.setCode(tempEntry.get('temp_name'));
							cg.assemblyCode.setCode("XX");

							resultAddress = tempEntry.get('temp_name') + " " + "XX";
						}
						else if(node.token && node.token.get('type') === Compiler.Token.T_FALSE)
						{
							Compiler.Logger.log("Propagating addresss of Literal false.", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

							// Load the accumulator with 0 (false)
							cg.assemblyCode.setCode("A9");
							cg.assemblyCode.setCode("00");

							var tempEntry = cg.tempJumpTable.insertEntry();

							// Store the accumulator at a temp address
							cg.assemblyCode.setCode("8D");
							cg.assemblyCode.setCode(tempEntry.get('temp_name'));
							cg.assemblyCode.setCode("XX");

							resultAddress = tempEntry.get('temp_name') + " " + "XX";
						}
						else if(node.token && node.token.get('type') === Compiler.Token.T_ID)
						{
							var idName = node.name,
								scope = node.symbolTableEntry.get('scope');

							var idTempName = cg.tempJumpTable.getEntryById(idName, scope);

							Compiler.Logger.log("Propagating address of id " + idName + ".", Compiler.Logger.INFO, Compiler.Logger.CODE_GENERATOR, true);

							// Pass back address of id, as it is already in memory
							resultAddress = idTempName.get('temp_name') + " " + "XX";
						}
						else if(node.token && node.token.get('type') === Compiler.Token.T_STRING_EXPRESSION)
						{
							var errorMessage = "Error! Comparison involving string literal on line " + node.token.get('line') + " is not supported.";
							Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.CODE_GENERATOR);
							throw errorMessage;
						}
					}
				}

				return resultAddress;
			}

			return traverse(node);
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