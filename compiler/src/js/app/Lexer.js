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

			// Make sure a source code string was provided
			if(typeof sourceCode != 'string' || sourceCode.trim() == '')
			{
				throw "Error! Please provide the source code.";
			}

			// Initialize variables
			var tokenList = new Backbone.Collection(),
				stringMode = false,
				eofFound = false,
				codeFragmentList = this.getCodeFragments(sourceCode),
				currentFragment = null,
				listIndex = 0;

			while (listIndex !== codeFragmentList.length && !eofFound)
			{
				// Get the current code fragment
				currentFragment = codeFragmentList[listIndex];

				// Check if the current fragment represents a valid token
				var token = Compiler.Token.getTokenFromCodeFragment(currentFragment);
				if(!token)
				{
					throw this._getParseErrorMessage(currentFragment);
				}

				// Process the token type
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

							var tempToken = Compiler.Token.getTokenFromCodeFragment(new Compiler.CodeFragment({
								code: token.get('code') + nextWord,
								line: nextCodeFragment.get('line')
							}));

							// Handle double equals
							if (tempToken)
							{
								token = tempToken;
								listIndex++;
							}
						}

						break;

					case Compiler.Token.T_EXCLAMATION_POINT:

						// Past end of fragment list
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

						if (token && token.get('type') !== Compiler.Token.T_NOT_EQUALS)
						{
							throw this._getParseErrorMessage(currentFragment, Compiler.Token.T_EXCLAMATION_POINT);
						}

						listIndex++;

						break;
				}

				tokenList.add(token);

				listIndex++;
			}

			// EOF token found, check if its in the correct place
			if(eofFound)
			{
				// EOF token found but not at end of the token list
				if (listIndex !== codeFragmentList.length)
				{
					var eofLine = tokenList.at(tokenList.length - 1).get('line');
					throw "Input found after EOF character, which was on line " + eofLine + ".";
				}
			}

			// Raise a warning and add EOF token to the end of the token list
			else
			{
				Compiler.dispatcher.trigger('log', 'warning', "EOF character was not found. Adding it to the token list.");

				var eofToken = new Compiler.Token({
					type: Compiler.Token.T_EOF,
					code: "$",
					line: tokenList.at(tokenList.length - 1).get('line') + 1
				});

				tokenList.add(eofToken);
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

			// Initialize variables
			var codeFragmentList = [],
				stringMode = false, // True when the chars of a string are getting processed
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
					// Processing the characters of a string.
					// currentWord is concatenated with the chars of the string until and
					// ending double quote is found.
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

		/**
		 * Iterates over the elements in the specified code fragment list
		 * and splits the code fragments into sub fragments by using the
		 * list of delimiters in Lexer.DELIMITERS_PATTERN.
		 *
		 * @param {Compiler.CodeFragment[]} codeFragmentList
		 * @returns {Compiler.CodeFragment[]}
		 * @private
		 */
		_splitSourceCodeFragmentsOnDelimiters: function (codeFragmentList) {

			// Initialize variables
			var stringMode = false,
				delimiterFound = false,
				currentFragment = null,
				currentCode = "",
				wordIndex = 0;

			while (wordIndex !== codeFragmentList.length)
			{
				currentFragment = codeFragmentList[wordIndex];
				currentCode = currentFragment.get('code');

				// iterate over all the characters in the fragment
				for (var charIndex = 0; charIndex !== currentCode.length; charIndex++)
				{
					var currentChar = currentCode.charAt(charIndex);

					if (currentCode.length === 1)
					{
						if (Lexer.QUOTE_PATTERN.test(currentChar))
						{
							stringMode = stringMode ? false : true;
						}

						continue;
					}

					if (Lexer.DELIMITERS_PATTERN.test(currentChar))
					{
						var beforeIndex = 0,
							afterIndex = 0;

						// Special case: extract first char of the string
						if (charIndex === 0)
						{
							beforeIndex = afterIndex = charIndex + 1;
						}
						else
						{
							beforeIndex = afterIndex = charIndex;
						}

						var subStringBefore = currentCode.substring(0, beforeIndex),
							subStringAfter = currentCode.substring(afterIndex, currentCode.length);

						if (subStringBefore.length !== 0)
						{
							currentFragment.set('code', subStringBefore);
							codeFragmentList[wordIndex] = currentFragment;
						}

						// Insert substring as a new code fragment after the current fragment
						if (subStringAfter.length !== 0)
						{
							var fragment = new Compiler.CodeFragment({
								code: subStringAfter,
								line: currentFragment.get('line')
							});

							codeFragmentList.splice(wordIndex + 1, 0, fragment);
						}

						delimiterFound = true;
						break;
					}
					else if (stringMode)
					{
						var subStringBefore = currentChar,
							subStringAfter = currentCode.substring(1, currentCode.length);

						if (subStringBefore.length !== 0)
						{
							currentFragment.set('code', subStringBefore);
							codeFragmentList[wordIndex] = currentFragment;
						}

						// Insert substring as a new code fragment after the current fragment
						if (subStringAfter.length !== 0)
						{
							var fragment = new Compiler.CodeFragment({
								code: subStringAfter,
								line: currentFragment.get('line')
							});

							codeFragmentList.splice(wordIndex + 1, 0, fragment);
						}

						delimiterFound = true;
						break;
					}
				}

				if (!delimiterFound)
				{
					wordIndex++;
				}

				delimiterFound = false;
			}

			return codeFragmentList;
		},


		/**
		 * Returns the error message for the specified code fragment
		 * and token type.
		 *
		 * @param {Compiler.CodeFragment} codeFragment
		 * @param {Number} tokenType
		 * @returns {string} Error message
		 */
		_getParseErrorMessage: function(codeFragment, tokenType) {
			var errorMessage = '';

			switch(tokenType)
			{
				case Compiler.Token.T_DIGIT:
					errorMessage = "Error on line {line}: {code} is not a valid string character.";
					break;
				case Compiler.Token.T_WHITE_SPACE:
					errorMessage = "Error on line {line}: Newline is not a valid string character.";
					break;
				default:
					errorMessage = "Error on line {line}: {code} is not a valid lexeme.";
					break;
			}

			return errorMessage.replace("{line}", codeFragment.get('line')).replace("{code}", codeFragment.get('code'));
		}

	}, {
		WHITE_SPACE_PATTERN: /^[\s|\n]$/,
		EOL_PATTERN: /^[\r|\n]$/,
		QUOTE_PATTERN: /^"$/,
		DELIMITERS_PATTERN: /^[\{\}\(\_\)\$\"!=+]$/
	});

	Compiler.Lexer = Lexer;

})(Backbone, Compiler);