/**
 * Collection used to represent the temp jump table
 */

(function (Backbone, Compiler) {

	var TempJumpTable = Collection.Model.extend({

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
		}

	});

	Compiler.TempJumpTable = TempJumpTable;

})(Backbone, Compiler);