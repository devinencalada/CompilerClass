/**
 * Classed used to represent entries in the
 * symbol table.
 */

(function (Backbone, Compiler) {

	var SymbolTableEntry = Backbone.Model.extend({
		defaults: {
			entry_number: -1,
			name: '',
			type: '',
			line: -1,
			scope: -1,
			references: 0
		}
	});

	Compiler.SymbolTableEntry = SymbolTableEntry;

})(Backbone, Compiler);