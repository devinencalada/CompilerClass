/**
 * Created by Devin on 2/21/2016.
 */
public class Tokens {
  public static enum TokenType {
    // Defining the tokens and what makes them in order to know what to search for in the string
    digit("-?[0-9]+"),
    Id (" (a|b|c|d|e|f|g|h|i|j|k|l|m|n|o|p|q|r|s|t|u|v|w|x|y|z) "),
    leftBracket ("[{]"),
    rightBracket ("[}]"),
    print ("(print)"),
    leftParen ("[(]"),
    rightParen ("[)]"),
    type ("(int|string|boolean)"),
    whileExp ("(while)"),
    ifExp ("(if)"),
    space ("[ ]"),
    plus("[+]"),
    assign ("[=]"),
    equals ("[==]"),
    notEqualTo ("[!=]"),
    WHITESPACE("[ \t\f\r\n]+");

    public final String pattern;

    private TokenType(String pattern) {
      this.pattern = pattern;
    }
  }

  // A new class to hold the Token Data
  public static class Token {
    public TokenType type;
    public String data;

    public Token(TokenType type, String data) {
      this.type = type;
      this.data = data;
    }

  }
}
