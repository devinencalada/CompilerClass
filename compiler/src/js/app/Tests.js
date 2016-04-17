function printCode(sourceCode) {
	var sourceCodeTemplate = _.template($('#source-code-template').text());
	$("#output").append(sourceCodeTemplate({source_code: sourceCode}));
}

function printTokenList(tokens) {
	var tokenListTemplate = _.template($('#token-list-template').text());
	$("#output").append(tokenListTemplate({tokens: tokens.toJSON()}));
}

function printTree(name, tree) {
	var treeTemplate = _.template($('#tree-template').text());
	$("#output").append(treeTemplate({
		name: name,
		tree: tree
	}));
}

function printSymbolTable(symbolTable) {
	var htmlTable = document.createElement('TABLE'),
		firstScopeTable = symbolTable.currentScopeTable;

	htmlTable.setAttribute('class', 'table table-striped table-bordered');

	var row = htmlTable.insertRow(-1);
	var idCell = row.insertCell(-1);
	idCell.innerHTML = 'Name';

	var typeCell = row.insertCell(-1);
	typeCell.innerHTML = 'Type';

	var scopeCell = row.insertCell(-1);
	scopeCell.innerHTML = 'Scope';

	var lineCell = row.insertCell(-1);
	lineCell.innerHTML = 'Line #';

	function printBody(currentScopeTable, htmlTable)
	{
		for (var entryIndex = 0; entryIndex < currentScopeTable.entries.length; entryIndex++)
		{
			var entry = currentScopeTable.entries.at(entryIndex);
			if(entry)
			{
				var row = htmlTable.insertRow(-1);

				var idCell = row.insertCell(-1);
				idCell.innerHTML = entry.get('name');

				var typeCell = row.insertCell(-1);
				typeCell.innerHTML = entry.get('type');

				var scopeCell = row.insertCell(-1);
				scopeCell.innerHTML = currentScopeTable.get('scope');

				var lineCell = row.insertCell(-1);
				lineCell.innerHTML = entry.get('line');
			}
		}

		var childScopeTables = currentScopeTable.childScopeTables;

		if (childScopeTables.length > 0)
		{
			for (var childIndex = 0; childIndex < childScopeTables.length; childIndex++)
			{
				var childScope = childScopeTables[childIndex];
				printBody(childScope, htmlTable);
			}
		}
	}

	printBody(firstScopeTable, htmlTable);

	$("#output").append('<h3>Symbol Table</h3>').append($(htmlTable));
}

function printLog() {
	// Get the logs
	var verbose = $('input[type="checkbox"]').prop('checked');

	var logs;

	if(verbose)
	{
		logs = Compiler.Logger.logs;
	}
	else
	{
		logs = new Backbone.Collection(Compiler.Logger.logs.where({
			verbose: 0
		}));
	}

	var logTemplate = _.template($('#log-template').text());
	$("#output").append(logTemplate({logs: logs.toJSON()}));

	// Reset the logs
	Compiler.Logger.logs.reset();
}

function runProgram(sourceCode) {

	var parser = new Compiler.Parser();

	// Parse the code
	try
	{
		parser.parse(sourceCode);
	}
	catch(err)
	{

	}

	printCode(sourceCode);

	if(parser.tokens)
	{
		printTokenList(parser.tokens);
	}

	if(parser.cst)
	{
		var ast = Compiler.AbstractSyntaxTree.makeAST(parser.cst),
			semanticAnalyzer = new Compiler.SemanticAnalyzer();

		printTree('CST', _.escape(parser.cst.toString()));
		printTree('AST', _.escape(ast.toString()));

		semanticAnalyzer.analyze(ast);

		printSymbolTable(semanticAnalyzer.symbolTable)
	}

	printLog();
}

$(document).ready(function() {

	var testCodeList = [
		{ name: "Addition", code: "\n{\n\tint a\n\ta = 4\n\n\tint b\n\tb = 2 + a\n} $\n" },
		{ name: "String", code: "\n{\n\tint a\n\ta = 4\n\tif (a == 4) {\n\t\tprint(\"hello world\")\n\t}\n} $\n" },
		{ name: "If 1", code: "\n{\n\tif (1 == 1) {\n\t\tint a\n\t\ta = 1\n\t}\n} $\n" },
		{ name: "If 2", code: "\n{\n\tif (1 != 2) {\n\t\tint a\n\t\ta = 1\n\t}\n} $\n" },
		{ name: "If 3", code: "\n{\n\tint a\n\ta = 1\n\n\tif(a == 1) {\n\t\ta = 2\n\t}\n\n\tif(a != 1) {\n\t\ta = 3\n\t}\n} $\n" },
		{ name: "While", code: "\n{\n\tint x\n\tx = 0\n\n\twhile (x != 5) \n\t{\n\t\tprint(x)\n\t\tx = 1 + x\n\t}\n} $\n" },
		{ name: "Boolean", code: "\n{\n\tint a\n\ta = 1\n\n\tboolean b\n\tb = (true == (true != (false == (true != (false != (a == a))))))\n\n\tprint(b)\n} $\n" },
		{ name: "Type Decl Error", code: "\n{\n\tint 7\n\ta = 3\n} $\n" },
		{ name: "Boolean Error", code: "\n{\n\tint a\n\ta = 4\n\tif (a = 4) {\n\t\tprint(\"hello world\")\n\t}\n} $\n" },
		{ name: "Lexeme Error", code: "\n{\n\tint a\n\ta = 1\n\n\tif(a == 1) {\n\t\ta = 2\n\t}\n\n\telse(a != 1) {\n\t\ta = 3\n\t}\n} $\n" },
		{ name: "Missing-Brace Error", code: "\n{\n\tint a\n\ta = 4\n\n\tint b\n\tb = 2 + a\n $\n" },
		{ name: "Int over Digit Error", code: "\n{\n\tint a\n\ta = 42\n\n\tint b\n\tb = 2 + a\n} $\n" },
	];

	// Populate the textarea when a selection has been made
	// in the tests examples.
	$("select").on("change", function(e) {
		var value = $(this).val();
		if(value !== "")
		{
			var code = '';

			if(value == testCodeList.length)
			{
				for(var i = 0; i < testCodeList.length; i++)
				{
					code += testCodeList[i].code;
				}
			}
			else
			{
				code = testCodeList[value].code;
			}

			$("textarea").val(code);
		}
	});

	// Parse code once the form has been submitted
	$("form").on("submit", function(e) {
		e.preventDefault();

		// Get the source code from the textarea
		var sourceCode = $("textarea").val().trim();
		if(sourceCode == '')
		{
			alert('Please enter a code block.');
			return;
		}

		// Reset output elements
		$("#output").empty();

		var sourceCodes = sourceCode.split("$");

		for(var i = 0; i < sourceCodes.length; i++)
		{
			var sourceCode = sourceCodes[i].trim();
			if(sourceCode != '')
			{
				runProgram(sourceCode + "$");
			}
		}
	});
});