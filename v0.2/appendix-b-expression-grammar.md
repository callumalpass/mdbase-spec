---
type: appendix
id: appendix-b-expression-grammar
title: "Expression Grammar"
description: "Formal EBNF grammar for the expression language"
letter: b
normative: false
depends_on:
  - "[[11-expressions]]"
---

# Appendix B: Expression Grammar

This appendix provides a formal grammar for the expression language used in filters, match conditions, and formulas.

---

## B.1 Grammar Notation

This grammar uses Extended Backus-Naur Form (EBNF):

- `=` defines a production rule
- `|` denotes alternatives
- `[ ]` denotes optional elements
- `{ }` denotes zero or more repetitions
- `" "` denotes literal strings
- `( )` groups elements
- `/* */` are comments

---

## B.2 Complete Grammar

```ebnf
(* Top-level *)
expression = null_coalescing_expression ;

(* Null coalescing - low precedence *)
null_coalescing_expression = or_expression { "??" or_expression } ;

(* Logical operators *)
or_expression = and_expression { "||" and_expression } ;

and_expression = not_expression { "&&" not_expression } ;

not_expression = "!" not_expression
               | comparison_expression ;

(* Comparison operators *)
comparison_expression = additive_expression [ comparison_op additive_expression ] ;

comparison_op = "==" | "!=" | "<" | ">" | "<=" | ">=" ;

(* Arithmetic operators *)
additive_expression = multiplicative_expression { ( "+" | "-" ) multiplicative_expression } ;

multiplicative_expression = unary_expression { ( "*" | "/" | "%" ) unary_expression } ;

unary_expression = "-" unary_expression
                 | postfix_expression ;

(* Property access and function calls *)
postfix_expression = primary_expression { postfix_op } ;

postfix_op = "." identifier [ call_arguments ]   (* Method or property *)
           | "[" expression "]"                   (* Index access *)
           | call_arguments ;                     (* Function call *)

call_arguments = "(" [ argument_list ] ")" ;

argument_list = expression { "," expression } ;

(* Primary expressions *)
primary_expression = literal
                   | identifier
                   | "(" expression ")"
                   | if_expression
                   | list_literal ;

(* If expression *)
if_expression = "if" "(" expression "," expression "," expression ")" ;

(* Literals *)
literal = string_literal
        | number_literal
        | boolean_literal
        | null_literal ;

string_literal = '"' { string_char } '"'
               | "'" { string_char } "'" ;

string_char = /* any character except quote or backslash */
            | escape_sequence ;

escape_sequence = "\\" ( '"' | "'" | "\\" | "n" | "r" | "t" ) ;

number_literal = integer_literal [ exponent ]
               | float_literal ;

integer_literal = [ "-" ] digit { digit } ;

float_literal = [ "-" ] digit { digit } "." digit { digit } [ exponent ] ;

exponent = ( "e" | "E" ) [ "+" | "-" ] digit { digit } ;

boolean_literal = "true" | "false" ;

null_literal = "null" ;

list_literal = "[" [ expression { "," expression } ] "]" ;

(* Identifiers *)
identifier = ( letter | "_" ) { letter | digit | "_" } ;

letter = "a" | "b" | ... | "z" | "A" | "B" | ... | "Z" ;

digit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" ;
```

---

## B.3 Operator Precedence

From highest to lowest precedence:

| Level | Operators | Associativity | Description |
|-------|-----------|---------------|-------------|
| 1 | `( )` | — | Grouping |
| 2 | `.` `[]` `()` | Left-to-right | Property access, index, call |
| 3 | `!` `-` (unary) | Right-to-left | Logical NOT, negation |
| 4 | `*` `/` `%` | Left-to-right | Multiplication, division, modulo |
| 5 | `+` `-` | Left-to-right | Addition, subtraction |
| 6 | `<` `<=` `>` `>=` | Left-to-right | Comparison |
| 7 | `==` `!=` | Left-to-right | Equality |
| 8 | `&&` | Left-to-right | Logical AND |
| 9 | `||` | Left-to-right | Logical OR |
| 10 | `??` | Left-to-right | Null coalescing |

---

## B.4 Reserved Words

The following identifiers are reserved:

```
true
false
null
if
note
file
formula
this
```

These cannot be used as bare field names without bracket notation (e.g., use `note["file"]` to access a frontmatter field named `file`).

The keywords `note`, `file`, `formula`, and `this` serve as namespace prefixes for property access (see [Querying §10.5](./10-querying.md)). `note.` accesses **raw persisted** frontmatter; bare field names access **effective** frontmatter. When a frontmatter field name collides with a namespace keyword, use the `note.` prefix with bracket notation: `note["file"]`, `note["formula"]`.

### `file` Namespace Properties

The `file` namespace provides access to file metadata. The following properties are valid under `file.`:

```
file.name       file.basename   file.path       file.folder
file.ext        file.size       file.ctime      file.mtime
file.body       file.links      file.backlinks  file.tags
file.properties file.embeds
```

`file.body` is a string containing the raw markdown body content (everything after the frontmatter closing `---`). It supports all string methods defined in [§11.5](./11-expressions.md).

### Chained Method Calls

The grammar supports chained method calls through the recursive `postfix_op` production. This explicitly includes chained `.asFile()` for multi-hop link traversal:

```
assignee.asFile().manager.asFile().name
```

This is parsed as a sequence of postfix operations:
```
postfix_expression
├── identifier: "assignee"
├── method_call: "asFile" ()
├── property_access: "manager"
├── method_call: "asFile" ()
└── property_access: "name"
```

Implementations MUST enforce a maximum traversal depth (default: 10) to prevent unbounded chains. See [§8.7](./08-links.md) for traversal rules.

---

## B.5 Whitespace and Comments

Whitespace (spaces, tabs, newlines) is ignored except within string literals.

Comments are not supported in the expression language. (Use YAML comments in query files instead.)

---

## B.6 String Escaping

Within string literals:

| Escape | Meaning |
|--------|---------|
| `\\` | Backslash |
| `\"` | Double quote |
| `\'` | Single quote |
| `\n` | Newline |
| `\r` | Carriage return |
| `\t` | Tab |

---

## B.7 Duration Literals

Duration literals are strings with a special format used in date arithmetic:

```ebnf
duration_literal = string_literal ;  (* Must match duration pattern *)

duration_pattern = number duration_unit ;

duration_unit = "y" | "year" | "years"
              | "M" | "month" | "months"
              | "w" | "week" | "weeks"
              | "d" | "day" | "days"
              | "h" | "hour" | "hours"
              | "m" | "minute" | "minutes"
              | "s" | "second" | "seconds" ;
```

Examples: `"7d"`, `"2 weeks"`, `"1h"`, `"30m"`

Note: Durations are regular strings; the arithmetic operators recognize them contextually.

---

## B.8 Parse Examples

### Simple Comparison

```
status == "open"
```

Parse tree:
```
comparison_expression
├── additive_expression
│   └── primary_expression
│       └── identifier: "status"
├── comparison_op: "=="
└── additive_expression
    └── primary_expression
        └── string_literal: "open"
```

### Combined Logic

```
priority >= 3 && status != "done"
```

Parse tree:
```
and_expression
├── comparison_expression
│   ├── identifier: "priority"
│   ├── ">="
│   └── number_literal: 3
└── comparison_expression
    ├── identifier: "status"
    ├── "!="
    └── string_literal: "done"
```

### Method Chain (Arrow Extension Only)

```
tags.filter(t => t.startsWith("bug")).length > 0
```

Parse tree (only valid if the optional arrow-function extension is enabled):
```
comparison_expression
├── postfix_expression
│   ├── postfix_expression
│   │   ├── identifier: "tags"
│   │   └── method_call: "filter"
│   │       └── lambda_expression
│   │           ├── parameter: "t"
│   │           └── method_call
│   │               ├── identifier: "t"
│   │               └── method: "startsWith"
│   │                   └── string_literal: "bug"
│   └── property_access: "length"
├── ">"
└── number_literal: 0
```

### Conditional

```
if(priority > 3, "high", "normal")
```

Parse tree:
```
if_expression
├── condition
│   └── comparison_expression
│       ├── identifier: "priority"
│       ├── ">"
│       └── number_literal: 3
├── then_value
│   └── string_literal: "high"
└── else_value
    └── string_literal: "normal"
```

---

## B.9 Implementation Notes

### Tokenization

Recommended token types:

```
STRING        : '"' ... '"' | "'" ... "'"
NUMBER        : [0-9]+ ('.' [0-9]+)?
IDENTIFIER    : [a-zA-Z_][a-zA-Z0-9_]*
BOOLEAN       : 'true' | 'false'
NULL          : 'null'
IF            : 'if'
OPERATOR      : '==' | '!=' | '<=' | '>=' | '<' | '>' | '&&' | '||' | '!' | '+' | '-' | '*' | '/' | '%' | '??' | '=>'
               (* include '=>' only if the optional arrow-function extension is enabled *)
PUNCTUATION   : '(' | ')' | '[' | ']' | '.' | ','
```

### Error Recovery

When parsing fails, implementations SHOULD:

1. Report the position of the error
2. Provide context (surrounding tokens)
3. Suggest likely fixes for common errors

Example error message:
```
Expression parse error at position 15:
  status == "open" && 
                      ^
  Expected: expression
  Found: end of input
  
  Hint: Expression is incomplete after '&&'
```

---

## B.10 Optional Arrow-Function Extension

Implementations MAY support arrow-function syntax in list methods. If supported,
the following grammar is added for lambda expressions used within argument lists:

```ebnf
lambda_expression = identifier "=>" expression
                 | "(" [ parameter_list ] ")" "=>" expression ;

parameter_list = identifier { "," identifier } ;
```
