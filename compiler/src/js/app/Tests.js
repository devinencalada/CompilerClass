$(document).ready(function() {

	var testCodeList = [
		{ name: "Addition", code: "{\n\tint a\n\ta = 4\n\n\tint b\n\tb = 2 + a\n} $" },
		{ name: "String", code: "{\n\tint a\n\ta = 4\n\tif (a == 4) {\n\t\tprint(\"hello world\")\n\t}\n} $" },
		{ name: "If 1", code: "{\n\tif (1 == 1) {\n\t\tint a\n\t\ta = 1\n\t}\n} $" },
		{ name: "If 2", code: "{\n\tif (1 != 2) {\n\t\tint a\n\t\ta = 1\n\t}\n} $" },
		{ name: "If 3", code: "{\n\tint a\n\ta = 1\n\n\tif(a == 1) {\n\t\ta = 2\n\t}\n\n\tif(a != 1) {\n\t\ta = 3\n\t}\n} $" },
		{ name: "While", code: "{\n\tint x\n\tx = 0\n\n\twhile (x != 5) \n\t{\n\t\tprint(x)\n\t\tx = 1 + x\n\t}\n} $" },
		{ name: "Boolean", code: "{\n\tint a\n\ta = 1\n\n\tboolean b\n\tb = (true == (true != (false == (true != (false != (a == a))))))\n\n\tprint(b)\n} $" },
		{ name: "Type Assignment Error", code: "{\n\tint 7\n\ta = 4\n\n\tint b\n\tb = 2 + a\n} $" },
		{ name: "Boolean Error", code: "{\n\tint a\n\ta = 4\n\tif (a = 4) {\n\t\tprint(\"hello world\")\n\t}\n} $" },
		{ name: "Unknown Lexeme Error", code: "{\n\tint a\n\ta = 1\n\n\tif(a == 1) {\n\t\ta = 2\n\t}\n\n\telse(a != 1) {\n\t\ta = 3\n\t}\n} $" },
		{ name: "Missing Brace/Parenthesis Error", code: "{\n\tint a\n\ta = 4\n\n\tint b\n\tb = 2 + a\n $" },
		{ name: "Integer over Digit Error", code: "{\n\tint a\n\ta = 42\n\n\tint b\n\tb = 2 + a\n} $" },
	];

	var validCodeTemplate = _.template($('#valid-code-template').text()),
		invalidCodeTemplate = _.template($('#invalid-code-template').text()),
		lexer = new Compiler.Lexer(),
		parser = new Compiler.Parser(),
		tokens = null;

	$("select").on("change", function(e) {
		var value = $(this).val();
		if(value !== "")
		{
			$("textarea").val(testCodeList[value].code);
		}
	});

	$("form").on("submit", function(e) {
		e.preventDefault();

		var source_code = $("textarea").val().trim();
		if(source_code == '')
		{
			alert('Please enter a code block.');
			return;
		}

		try
		{
			tokens = lexer.tokenize(source_code);
		}
		catch(err)
		{
			$("#output").empty().html(invalidCodeTemplate({
				source_code: source_code,
				error: "Lexical " + err
			}));

			return;
		}

		parser.setTokens(tokens);

		try
		{
			parser.parse();

			$("#output").empty().html(validCodeTemplate({
				source_code: source_code,
				tokens: tokens.toJSON()
			}))
		}
		catch(err)
		{
			$("#output").empty().html(invalidCodeTemplate({
				source_code: source_code,
				error: "Parsing " + err
			}))
		}
	});
});