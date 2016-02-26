$(document).ready(function() {

	var testCodeList = [
		{ name: "Addition", code: "{\n\tint a\n\ta = 4\n\n\tint b\n\tb = 2 + a\n} $" },
		{ name: "String", code: "{\n\tint a\n\ta = 4\n\tif (a == 4) {\n\t\tprint(\"hello world\")\n\t}\n} $" },
		{ name: "If 1", code: "{\n\tif (1 == 1) {\n\t\tint a\n\t\ta = 1\n\t}\n} $" },
		{ name: "If 2", code: "{\n\tif (1 != 2) {\n\t\tint a\n\t\ta = 1\n\t}\n} $" },
		{ name: "If 3", code: "{\n\tint a\n\ta = 1\n\n\tif(a == 1) {\n\t\ta = 2\n\t}\n\n\tif(a != 1) {\n\t\ta = 3\n\t}\n} $" },
		{ name: "While", code: "{\n\tint x\n\tx = 0\n\n\twhile (x != 5) \n\t{\n\t\tprint(x)\n\t\tx = 1 + x\n\t}\n} $" },
		{ name: "Boolean", code: "{\n\tint a\n\ta = 1\n\n\tboolean b\n\tb = (true == (true != (false == (true != (false != (a == a))))))\n\n\tprint(b)\n} $" },
	];

	var outputTemplate = _.template($('#output-template').text()),
		lexer = new Compiler.Lexer(),
		parser = new Compiler.Parser(),
		tokens = null,
		$outputElem = $("#output"),
		$textAreaElem = $("textarea"),
		$warningsLogElem = $("#warnings-log"),
		$errorsLogElem = $("#errors-log");

	// Populate the textarea when a selection has been made
	// in the tests examples.
	$("select").on("change", function(e) {
		var value = $(this).val();
		if(value !== "")
		{
			$textAreaElem.val(testCodeList[value].code);
		}
	});

	// Parse code once the form has been submitted
	$("form").on("submit", function(e) {
		e.preventDefault();

		// Reset output elements
		$warningsLogElem.hide().find('pre').empty();
		$errorsLogElem.hide().find('pre').empty();
		$outputElem.empty();

		// Get the source code from the textarea
		var source_code = $textAreaElem.val().trim();
		if(source_code == '')
		{
			alert('Please enter a code block.');
			return;
		}

		// Parse the code
		try
		{
			tokens = lexer.tokenize(source_code);
		}
		catch(err)
		{
			$outputElem.empty().html(invalidCodeTemplate({
				source_code: source_code,
				error: "Lexical " + err
			}));

			Compiler.dispatcher.trigger('log', 'error', "Lexical " + err);

			return;
		}

		parser.setTokens(tokens);

		try
		{
			parser.parse();

			$outputElem.html(outputTemplate({
				source_code: source_code,
				tokens: tokens.toJSON()
			}));
		}
		catch(err)
		{
			$outputElem.html(outputTemplate({
				source_code: source_code
			}));

			Compiler.dispatcher.trigger('log', 'error', "Parsing " + err);
		}
	});

	// Listen to the "log" event to update error and warning log elements
	Compiler.dispatcher.on('log', function(type, message) {
		if(type == 'warning')
		{
			$warningsLogElem.show().find('pre').append(" - " + message);
		}
		else
		{
			$errorsLogElem.show().find('pre').append(" - " + message);
		}
	});
});