/**
 * Event dispatcher
 *
 * The event dispatcher should be used to help communication
 * between two or more unrelated objects to prevent coupling
 * of objects.
 */

(function (Backbone, Compiler) {

	Compiler.dispatcher = _.clone(Backbone.Events);

})(Backbone, Compiler);