var _testCodeList = [
	{ name: "Addition", code: "{\n\tint a\n\ta = 4\n\n\tint b\n\tb = 2 + a\n} $" },
	{ name: "String", code: "{\n\tint a\n\ta = 4\n\tif (a == 4) {\n\t\tprint(\"hello world\")\n\t}\n} $" },
	{ name: "If 1", code: "{\n\tif (1 == 1) {\n\t\tint a\n\t\ta = 1\n\t}\n} $" },
	{ name: "If 2", code: "{\n\tif (1 != 2) {\n\t\tint a\n\t\ta = 1\n\t}\n} $" },
	{ name: "If 2", code: "{\n\tint a\n\ta = 1\n\n\tif(a == 1) {\n\t\ta = 2\n\t}\n\n\tif(a != 1) {\n\t\ta = 3\n\t}\n} $" },
	{ name: "While", code: "{\n\tint x\n\tx = 0\n\n\twhile (x != 5) \n\t{\n\t\tprint(x)\n\t\tx = 1 + x\n\t}\n} $" },
	{ name: "Boolean", code: "{\n\tint a\n\ta = 1\n\n\tboolean b\n\tb = (true == (true != (false == (true != (false != (a == a))))))\n\n\tprint(b)\n} $" },
];

$(document).ready(function() {

	var validCodeTemplate = _.template($('#valid-code-template').text()),
		invalidCodeTemplate = _.template($('#invalid-code-template').text())
		lexer = new Compiler.Lexer(),
		parser = new Compiler.Parser();

	for(var i = 0; i < _testCodeList.length; i++)
	{
		var code = _testCodeList[i].code;
		var tokens = lexer.tokenize(code);
		parser.setTokens(tokens);

		try
		{
			parser.parse();

			$("#output").append(validCodeTemplate({
				index: i+1,
				source_code: code,
				tokens: tokens.toJSON()
			}))
		}
		catch(err)
		{
			$("#output").append(invalidCodeTemplate({
				index: i+1,
				source_code: code,
				tokens: tokens.toJSON(),
				error: err
			}))
		}
	}
});