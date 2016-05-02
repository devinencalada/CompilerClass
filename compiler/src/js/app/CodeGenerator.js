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
				this.assemblyCode.add(Compiler.CodeGenerator.NO_CODE);
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
		},

		/**
		 * Creates and adds to the temp jump table
		 * an instance of Compiler.TempJumpTableEntry.
		 *
		 * @returns {Compiler.TempJumpTableEntry}
		 */
		insertTempJumpTableEntry: function() {

			var entry = new Compiler.TempJumpTableEntry({
				temp_name: 'T' + this.tempJumpTable.length.toString(),
				address_offset: this.tempJumpTable.length
			});

			this.tempJumpTable.add(entry);

			return entry;
		},

		/**
		 * Returns an entry from the temp jump table by
		 * the specified id name and scope level.
		 *
		 * @param {String} id - ID name
		 * @param {Number} scope - Scope level
		 * @returns {Compiler.TempJumpTable}
		 */
		getTempJumpTableEntry: function(id, scope) {

			var entry = this.tempJumpTable.findWhere({
				id_name: id,
				scope: scope
			});

			if (entry)
			{
				return entry;
			}
			else
			{
				var errorMessage = 'Error! Id ' + id + ' was not found in the temp table.';
				Compiler.Logger.log(errorMessage, Compiler.Logger.ERROR, Compiler.Logger.CODE_GENERATOR);
				throw errorMessage;
			}
		}

	}, {
		MAX_CODE_SIZE: 256,
		NO_CODE: "00"
	});

	Compiler.CodeGenerator = CodeGenerator;

})(Backbone, Compiler);