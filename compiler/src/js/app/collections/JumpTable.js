/**
 * Collection used to represent the jump table
 */

(function (Backbone, Compiler) {

	var JumpTable = Backbone.Collection.extend({

		model: Compiler.JumpTableEntry,

		/**
		 * Creates and adds an entry to the jump table.
		 *
		 * @returns {Compiler.JumpTableEntry}
		 */
		insertEntry: function() {

			var entry = new Compiler.JumpTableEntry({
				temp_name: 'J' + this.length.toString()
			});

			this.add(entry);

			return entry;
		}
	});

	Compiler.JumpTable = JumpTable;

})(Backbone, Compiler);