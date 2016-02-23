/**
 * Class used to represent the lexer.
 * The main function for the lexers is to parse the source code and
 * return a list of valid tokens found. The lexer also throws parse errors when found.
 */

(function (Backbone, Compiler) {
	
	var Lexer = Backbone.Model.extend({

		/**
		 * Parses the specified source code and returns the list
		 * of tokens found in the code.
		 *
		 * @param {String} sourceCode
		 * @returns {Compiler.Tokens[]} Array of Compiler.Token instances
		 */
		 tokenize: function (sourceCode) {

			var tokenList = [],
				stringMode = false,
				eofFound = false,
				codeFragmentList = this.getCodeFragments(sourceCode),
				currentFragment = null,
				listIndex = 0;

			while (listIndex !== codeFragmentList.length && !eofFound)
			{
				currentFragment = codeFragmentList[listIndex];

				var token = Compiler.Token.getTokenFromCodeFragment(currentFragment);

				if(token)
				{
					switch (token.get('type'))
					{
						case Compiler.Token.T_QUOTE:
							stringMode = stringMode ? false : true;
							break;

						case Compiler.Token.T_EOF:
							eofFound = true;
							break;

						case Compiler.Token.T_ID:
							if (stringMode)
							{
								token.set('type', Compiler.Token.T_CHAR);
							}

							break;

						case Compiler.Token.T_DIGIT:
							if (stringMode)
							{
								throw this._getParseErrorMessage(currentFragment, Compiler.Token.T_DIGIT);
							}

							break;

						case Compiler.Token.T_WHITE_SPACE:
							if (stringMode && token.get('code') === "\n")
							{
								throw this._getParseErrorMessage(currentFragment, Compiler.Token.T_WHITE_SPACE);
							}

							break;

						case Compiler.Token.T_SINGLE_EQUALS:
							// Next element is available
							if (!(listIndex + 1 === codeFragmentList.length))
							{
								var nextCodeFragment = codeFragmentList[listIndex + 1],
									nextWord = nextCodeFragment.get('code');

								token = Compiler.Token.getTokenFromCodeFragment(new Compiler.CodeFragment({
									code: token.get('code') + nextWord,
									line: nextCodeFragment.get('line')
								}));

								// Handle double equals
								if (token)
								{
									listIndex++;
								}
							}
							else
							{
								// Handle single equals otherwise
							}

							break;

						case Compiler.Token.T_EXCLAMATION_POINT:
							// No more code follows
							if ((listIndex + 1) === codeFragmentList.length)
							{
								throw this._getParseErrorMessage(currentFragment);
							}

							var nextCodeFragment = codeFragmentList[listIndex + 1],
								nextWord = nextCodeFragment.get('code');

							token = Compiler.Token.getTokenFromCodeFragment(new Compiler.CodeFragment({
								code: token.get('code') + nextWord,
								line: nextCodeFragment.get('line')
							}));

							if (token && token.get('type') === Compiler.Token.T_NOT_EQUALS)
							{
								listIndex++;
							}
							else
							{
								throw this._getParseErrorMessage(currentFragment, Compiler.Token.T_EXCLAMATION_POINT);
							}

							break;
					}

					tokenList.push(token);
				}
				else
				{
					throw this._getParseErrorMessage(currentFragment);
				}

				listIndex++;
			}

			if (tokenList.length === 0)
			{
				throw "Error! Input was only whitespace, so no tokens were found.";
			}

			if(eofFound)
			{
				// EOF should be last element in code list
				if (listIndex !== codeFragmentList.length)
				{
					var eofLine = tokenList[tokenList.length - 1].line;
					throw "Input found after EOF character, which was on line " + eofLine + ".";
				}
			}
			else
			{
				throw "EOF character was not found.";
			}

			return tokenList;
		},
		
		/**
		 * Returns a list of code fragments for the specified source code.
		 *
		 * @param {String} sourceCode
		 * @returns {Compiler.CodeFragment[]}
		 *
		 */
		getCodeFragments: function(sourceCode) {
			return this._splitSourceCodeFragmentsOnDelimiters(this._splitSourceCodeOnSpaces(sourceCode));
		},
		
				/**
		 * Splits the source code into fragments using the whitespace
		 * as the delimiter. The fragments are stored in an array of instances of Compiler.CodeFragment.
		 *
		 * @param {String} sourceCode
		 * @returns {Compiler.CodeFragment[]} Array of instances of Compiler.CodeFragment
		 * @private
		 */
		_splitSourceCodeOnSpaces: function (sourceCode) {
			var codeFragmentList = [],
				stringMode = false,
				currentWord = "",
				currentLine = 1,
				charIndex = 0;

			while (charIndex !== sourceCode.length)
			{
				var currentChar = sourceCode.charAt(charIndex);
				charIndex++;

				if (!Lexer.WHITE_SPACE_PATTERN.test(currentChar))
				{
					currentWord += currentChar;
				}
				else
				{
					if (stringMode)
					{
						currentWord += currentChar;
					}
					else if (currentWord.length > 0)
					{
						codeFragmentList.push(new Compiler.CodeFragment({
							code: currentWord,
							line: currentLine
						}));

						currentWord = "";
					}
				}

				if (Lexer.QUOTE_PATTERN.test(currentChar))
				{
					stringMode = stringMode ? false : true;
				}

				if (charIndex === sourceCode.length)
				{
					if (currentWord.length > 0)
					{
						codeFragmentList.push(new Compiler.CodeFragment({
							code: currentWord,
							line: currentLine
						}));

						currentWord = "";
					}
				}

				if (Lexer.EOL_PATTERN.test(currentChar))
				{
					currentLine++;
				}
			}

			return codeFragmentList;
		},
	});
	
}
