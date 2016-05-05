/**
 * Collection used to represent the temp jump table
 */

(function (Backbone, Compiler) {

	var TempJumpTable = Backbone.Collection.extend({

		model: Compiler.TempJumpTableEntry,

		/**
		 * Creates and adds an entry to the temp jump table.
		 *
		 * @returns {Compiler.TempJumpTableEntry}
		 */
		insertEntry: function() {

			var entry = new Compiler.TempJumpTableEntry({
				temp_name: 'T' + this.length.toString(),
				address_offset: this.length
			});

			this.add(entry);

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
		getEntryById: function(id, scope) {

			var entry = this.findWhere({
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

	});

	Compiler.TempJumpTable = TempJumpTable;

})(Backbone, Compiler);