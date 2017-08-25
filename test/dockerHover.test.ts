/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, Hover, Position } from 'vscode-languageserver';
import { MarkdownDocumentation } from '../src/dockerMarkdown';
import { DockerHover } from '../src/dockerHover';

let markdownDocumentation = new MarkdownDocumentation();
let hoverProvider = new DockerHover(markdownDocumentation);

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function onHover(document: TextDocument, line: number, character: number): Hover | null {
	let textDocumentPosition = {
		textDocument: {
			uri: document.uri
		},
		position: Position.create(line, character)
	};
	return hoverProvider.onHover(document, textDocumentPosition);
}

function onHoverString(content: string, line: number, character: number): Hover | null {
	return onHover(createDocument(content), line, character);
}

describe("Dockerfile hover", function() {
	describe("whitespace", function() {
		it("empty file", function() {
			let document = createDocument("");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, null);
		});

		it("spaces", function() {
			let document = createDocument("    ");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, null);
		});

		it("tabs", function() {
			let document = createDocument("\t\t\t\t");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, null);
		});
	});

	describe("comments", function() {
		it("# FROM node", function() {
			let document = createDocument("3");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, null);
		});
	});

	describe("directives", function() {
		it("escape", function() {
			let document = createDocument("#escape=`");
			let hover = onHover(document, 0, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("escape"));

			document = createDocument("# escape=`");
			hover = onHover(document, 0, 1);
			assert.equal(hover, null);
		});

		it("invalid directive definition", function() {
			let document = createDocument("#eskape=`");
			let hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape ");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape=");
			hover = onHover(document, 0, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("escape"));

			document = createDocument("#escape=ab");
			hover = onHover(document, 0, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("escape"));

			document = createDocument("#escape\t");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape\r\n");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("#escape\n");
			hover = onHover(document, 0, 4);
			assert.equal(hover, null);

			document = createDocument("\n#escape");
			hover = onHover(document, 1, 4);
			assert.equal(hover, null);

			document = createDocument("\r#escape");
			hover = onHover(document, 1, 4);
			assert.equal(hover, null);

			document = createDocument("\r\n#escape");
			hover = onHover(document, 1, 4);
			assert.equal(hover, null);
		});
	});

	describe("keywords", function() {
		it("FROM", function() {
			let document = createDocument("FROM node");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("froM", function() {
			let document = createDocument("froM node");
			let hover = onHover(document, 0, 2);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("fr\\\\noM", function() {
			let document = createDocument("fr\\\noM node");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 0, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("fr\\\\roM", function() {
			let document = createDocument("fr\\\roM node");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 0, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("fr\\\\r\\noM", function() {
			let document = createDocument("fr\\\r\noM node");
			let hover = onHover(document, 0, 0);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 0, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));

			hover = onHover(document, 1, 1);
			assert.equal(hover, markdownDocumentation.getMarkdown("FROM"));
		});

		it("HEALTHCHECK NONE", function() {
			let document = createDocument("HEALTHCHECK NONE");
			let hover = onHover(document, 0, 14);
			assert.equal(hover, null);
		});

		it("newlines", function() {
			let document = createDocument("FROM node\nEXPOSE 8081");
			let hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("FROM node\rEXPOSE 8081");
			hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("FROM node\r\nEXPOSE 8081");
			hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("invalid escape", function() {
			let document = createDocument("FR\\OM node");
			let hover = onHover(document, 0, 1);
			assert.equal(hover, null);

			hover = onHover(document, 0, 3);
			assert.equal(hover, null);
		});

		function createVariablesTest(testSuiteName: string, instruction: string, delimiter: string) {
			const space = delimiter === " ";

			describe(testSuiteName, function() {
				it("variable name", function() {
					let document = createDocument(instruction + " z" + delimiter + "y");
					let hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " z" + delimiter + "#");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "#");

					document = createDocument(instruction + " e" + delimiter + "'f g=h'");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "f g=h");

					document = createDocument(instruction + " x" + delimiter + "\"v v=w\"");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "v v=w");
				});

				it("variable value", function() {
					let document = createDocument(instruction + " z" + delimiter + "y");
					let hover = onHover(document, 0, 6);
					assert.equal(hover, null);
				});

				it("no variable value", function() {
					let document = createDocument(instruction + " z");
					let hover = onHover(document, 0, 5);
					assert.equal(hover, null);
				});

				it("empty variable value", function() {
					let document = createDocument(instruction + " z" + delimiter + "");
					let hover = onHover(document, 0, 5);
					if (delimiter === " ") {
						assert.equal(hover, null);
					} else {
						assert.equal(hover.contents, "");
					}
				});

				it("whitespace variable value", function() {
					let document = createDocument(instruction + " z" + delimiter + "   \t\t   ");
					let hover = onHover(document, 0, 5);
					if (delimiter === " ") {
						assert.equal(hover, null);
					} else {
						assert.equal(hover.contents, "");
					}
				});

				it("escaped", function() {
					let document = createDocument(instruction + " \\ \t\nz" + delimiter + "y");
					let hover = onHover(document, 1, 0);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " \\ \t\rz" + delimiter + "y");
					hover = onHover(document, 1, 0);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " \\ \t\r\nz" + delimiter + "y");
					hover = onHover(document, 1, 0);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " z" + delimiter + "y \\ \t\n \t");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " z" + delimiter + "y \\ \t\r \t");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " z" + delimiter + "y \\ \t\r\n \t");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " z" + delimiter + "\\\ny");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " z" + delimiter + "\\\n'y'");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "y");

					document = createDocument(instruction + " z" + delimiter + "\\\n\"y\"");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "y");

					hover = onHoverString(instruction + " a" + delimiter + "\\", 0, 5);
					if (delimiter === " ") {
						// just the escape character at EOF, so considered to be the empty string
						assert.equal(hover, null);
					} else {
						assert.equal(hover.contents, "");
					}

					hover = onHoverString(instruction + " a" + delimiter + "a\\ x", 0, 5);
					assert.equal(hover.contents, "a x");

					hover = onHoverString(instruction + " a" + delimiter + "a\\\nx", 0, 5);
					assert.equal(hover.contents, "ax");

					hover = onHoverString(instruction + " a" + delimiter + "a\\\rx", 0, 5);
					assert.equal(hover.contents, "ax");

					hover = onHoverString(instruction + " a" + delimiter + "a\\\r\nx", 0, 5);
					assert.equal(hover.contents, "ax");

					hover = onHoverString(instruction + " a" + delimiter + "a\\  \nx", 0, 5);
					assert.equal(hover.contents, "ax");

					hover = onHoverString(instruction + " a" + delimiter + "a\\ \t \rx", 0, 5);
					assert.equal(hover.contents, "ax");

					hover = onHoverString(instruction + " a" + delimiter + "a\\  \t\t\r\nx", 0, 5);
					assert.equal(hover.contents, "ax");

					hover = onHoverString(instruction + " a" + delimiter + "\\b", 0, 5);
					assert.equal(hover.contents, "b");

					hover = onHoverString(instruction + " a" + delimiter + "\\\\b", 0, 5);
					assert.equal(hover.contents, "\\b");

					hover = onHoverString(instruction + " a" + delimiter + "\\\\\\\\\\b", 0, 5);
					assert.equal(hover.contents, "\\\\b");
				});

				it("escape in literals", function() {
					let hover = onHoverString(instruction + " a" + delimiter + "\"a\\ x\"", 0, 5);
					assert.equal(hover.contents, "a\\ x");

					hover = onHoverString(instruction + " a" + delimiter + "'a\\ x'", 0, 5);
					assert.equal(hover.contents, "a\\ x");

					hover = onHoverString(instruction + " a" + delimiter + "\"a \\x\"", 0, 5);
					assert.equal(hover.contents, "a \\x");

					hover = onHoverString(instruction + " a" + delimiter + "\"a \\\\x\"", 0, 5);
					assert.equal(hover.contents, "a \\x");

					hover = onHoverString(instruction + " a" + delimiter + "\"a \\\\ x\"", 0, 5);
					assert.equal(hover.contents, "a \\ x");

					hover = onHoverString(instruction + " a" + delimiter + "\"a \\\\\\x\"", 0, 5);
					assert.equal(hover.contents, "a \\\\x");

					hover = onHoverString(instruction + " a" + delimiter + "\"a \\\\\\ x\"", 0, 5);
					assert.equal(hover.contents, "a \\\\ x");

					hover = onHoverString(instruction + " a" + delimiter + "\"a \\\nx\"", 0, 5);
					assert.equal(hover.contents, "a x");

					hover = onHoverString(instruction + " a" + delimiter + "\"\\\\\\\\x\"", 0, 5);
					assert.equal(hover.contents, "\\\\x");

					hover = onHoverString(instruction + " a" + delimiter + "\"\\\\\\\\\\x\"", 0, 5);
					assert.equal(hover.contents, "\\\\\\x");

					hover = onHoverString(instruction + " a" + delimiter + "\"\\\\\\\\\\\\x\"", 0, 5);
					assert.equal(hover.contents, "\\\\\\x");

					hover = onHoverString(instruction + " a" + delimiter + "'a \\\nx'", 0, 5);
					assert.equal(hover.contents, "a x");
				});

				it("no variable", function() {
					let document = createDocument(instruction + "    ");
					let hover = onHover(document, 0, 5);
					assert.equal(hover, null);
				});

				it("referenced variable ${var}", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
					let hover = onHover(document, 1, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 2, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 11);
					assert.equal(hover.contents, "value");
					
					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
						"FROM alpine\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
					);
					hover = onHover(document, 2, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 11);
					assert.equal(hover.contents, "value");
					assert.equal(onHover(document, 6, 13), null);
					assert.equal(onHover(document, 7, 7), null);
					assert.equal(onHover(document, 8, 11), null);
					
					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value2\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
					);
					hover = onHover(document, 2, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 7, 13);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 8, 7);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 9, 11);
					assert.equal(hover.contents, "value2");

					document = createDocument(instruction + " var" + delimiter + "value\nARG var2=value2\nSTOPSIGNAL ${var}${var2}\nUSER ${var}${var2}\nWORKDIR ${var}${var2}");
					hover = onHover(document, 2, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 2, 20);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 3, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 14);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 4, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 18);
					assert.equal(hover.contents, "value2");

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nARG var2=value2\nSTOPSIGNAL ${var}${var2}\nUSER ${var}${var2}\nWORKDIR ${var}${var2}\n" +
						"FROM alpine\nSTOPSIGNAL ${var}${var2}\nUSER ${var}${var2}\nWORKDIR ${var}${var2}"
					);
					hover = onHover(document, 3, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 20);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 4, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 14);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 5, 18);
					assert.equal(hover.contents, "value2");
					assert.equal(onHover(document, 7, 13), null);
					assert.equal(onHover(document, 7, 20), null);
					assert.equal(onHover(document, 8, 7), null);
					assert.equal(onHover(document, 8, 14), null);
					assert.equal(onHover(document, 9, 11), null);
					assert.equal(onHover(document, 9, 18), null);

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nARG var2=value2\nSTOPSIGNAL ${var}${var2}\nUSER ${var}${var2}\nWORKDIR ${var}${var2}\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value3\nARG var2=value4\nSTOPSIGNAL ${var}${var2}\nUSER ${var}${var2}\nWORKDIR ${var}${var2}"
					);
					hover = onHover(document, 3, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 20);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 4, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 14);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 5, 18);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 9, 13);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 9, 20);
					assert.equal(hover.contents, "value4");
					hover = onHover(document, 10, 7);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 10, 14);
					assert.equal(hover.contents, "value4");
					hover = onHover(document, 11, 11);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 11, 18);
					assert.equal(hover.contents, "value4");
				});

				it("referenced variable ${var} no value", function() {
					let document = createDocument(instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
					let hover = onHover(document, 1, 13);
					assert.equal(hover, null);
					hover = onHover(document, 2, 7);
					assert.equal(hover, null);
					hover = onHover(document, 3, 11);
					assert.equal(hover, null);
				});

				it("referenced variable ${var} empty value", function() {
					let document = createDocument(instruction + " var" + delimiter + "\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
					let hover = onHover(document, 1, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 2, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
						"FROM alpine\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
					);
					hover = onHover(document, 2, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 4, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					assert.equal(onHover(document, 6, 13), null);
					assert.equal(onHover(document, 7, 7), null);
					assert.equal(onHover(document, 8, 11), null);
				});

				it("referenced variable ${var} whitespace", function() {
					let document = createDocument(instruction + " var" + delimiter + "   \t\t   \nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
					let hover = onHover(document, 1, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 2, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "   \t\t   \nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" + 
						"FROM alpine\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
					);
					hover = onHover(document, 2, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 4, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					assert.equal(onHover(document, 6, 13), null);
					assert.equal(onHover(document, 7, 7), null);
					assert.equal(onHover(document, 8, 11), null);
				});

				it("referenced variable ${var", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var\nUSER ${var\nWORKDIR ${var");
					assert.equal(onHover(document, 1, 14), null);
					assert.equal(onHover(document, 2, 8), null);
					assert.equal(onHover(document, 3, 11), null);

					document = createDocument("FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var\nUSER ${var\nWORKDIR ${var");
					assert.equal(onHover(document, 2, 14), null);
					assert.equal(onHover(document, 3, 8), null);
					assert.equal(onHover(document, 4, 11), null);
				});

				it("referenced variable $var", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
					let hover = onHover(document, 1, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 2, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 11);
					assert.equal(hover.contents, "value");

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\n" +
						"FROM alpine\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var"
					);
					hover = onHover(document, 2, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 11);
					assert.equal(hover.contents, "value");
					assert.equal(onHover(document, 6, 13), null);
					assert.equal(onHover(document, 7, 7), null);
					assert.equal(onHover(document, 8, 11), null);

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value2\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var"
					);
					hover = onHover(document, 2, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 7, 13);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 8, 7);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 9, 11);
					assert.equal(hover.contents, "value2");

					document = createDocument(instruction + " var" + delimiter + "value\nARG var2=value2\nSTOPSIGNAL $var$var2\nUSER $var$var2\nWORKDIR $var$var2");
					hover = onHover(document, 2, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 2, 17);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 3, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 12);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 4, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 15);
					assert.equal(hover.contents, "value2");

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nARG var2=value2\nSTOPSIGNAL $var$var2\nUSER $var$var2\nWORKDIR $var$var2\n" +
						"FROM alpine\nSTOPSIGNAL $var$var2\nUSER $var$var2\nWORKDIR $var$var2"
					);
					hover = onHover(document, 3, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 17);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 4, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 12);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 5, 15);
					assert.equal(hover.contents, "value2");
					assert.equal(onHover(document, 7, 13), null);
					assert.equal(onHover(document, 7, 17), null);
					assert.equal(onHover(document, 8, 7), null);
					assert.equal(onHover(document, 8, 12), null);
					assert.equal(onHover(document, 9, 11), null);
					assert.equal(onHover(document, 9, 15), null);

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nARG var2=value2\nSTOPSIGNAL $var$var2\nUSER $var$var2\nWORKDIR $var$var2\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value3\nARG var2=value4\nSTOPSIGNAL $var$var2\nUSER $var$var2\nWORKDIR $var$var2"
					);
					hover = onHover(document, 3, 13);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 17);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 4, 7);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 12);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 5, 15);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 9, 13);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 9, 17);
					assert.equal(hover.contents, "value4");
					hover = onHover(document, 10, 7);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 10, 12);
					assert.equal(hover.contents, "value4");
					hover = onHover(document, 11, 11);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 11, 15);
					assert.equal(hover.contents, "value4");
				});

				it("referenced variable $var no value", function() {
					let document = createDocument(instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
					assert.equal(onHover(document, 1, 13), null);
					assert.equal(onHover(document, 2, 7), null);
					assert.equal(onHover(document, 3, 11), null);

					document = createDocument("FROM alpine\n" + instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
					assert.equal(onHover(document, 2, 13), null);
					assert.equal(onHover(document, 3, 7), null);
					assert.equal(onHover(document, 4, 11), null);
				});

				it("referenced variable $var empty value", function() {
					let document = createDocument(instruction + " var" + delimiter + "\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
					let hover = onHover(document, 1, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 2, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");

					document = createDocument("FROM alpine\n" + instruction + " var" + delimiter + "\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
					hover = onHover(document, 2, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 4, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");
				});

				it("referenced variable $var whitespace", function() {
					let document = createDocument(instruction + " var" + delimiter + "   \t\t   \nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
					let hover = onHover(document, 1, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 2, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");

					document = createDocument("FROM alpine\n" + instruction + " var" + delimiter + "   \t\t   \nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
					hover = onHover(document, 2, 13);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 3, 7);
					assert.equal(space ? hover : hover.contents, space ? null : "");
					hover = onHover(document, 4, 11);
					assert.equal(space ? hover : hover.contents, space ? null : "");
				});

				it("referenced variable '$var'", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nRUN echo '$var'");
					let hover = onHover(document, 1, 12);
					assert.equal(hover.contents, "value");

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo '$var'\n" +
						"FROM alpine\nRUN echo '$var'"
					);
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 12);
					assert.equal(hover, null);

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo '$var'\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value2\nRUN echo '$var'"
					);
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 5, 12);
					assert.equal(hover.contents, "value2");
				});

				it("referenced variable \"$var\"", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nRUN echo \"$var\"");
					let hover = onHover(document, 1, 12);
					assert.equal(hover.contents, "value");

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo \"$var\"" +
						"FROM alpine\nRUN echo \"$var\""
					);
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 4, 12);
					assert.equal(hover, null);

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo \"$var\"\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value2\nRUN echo \"$var\""
					);
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 5, 12);
					assert.equal(hover.contents, "value2");
				});

				it("referenced variable \\${var}", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL \\${var}\nUSER \\${var}\nWORKDIR \\${var}");
					assert.equal(onHover(document, 1, 15), null);
					assert.equal(onHover(document, 2, 10), null);
					assert.equal(onHover(document, 3, 12), null);

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL \\${var}\nUSER \\${var}\nWORKDIR \\${var}"
					);
					assert.equal(onHover(document, 2, 15), null);
					assert.equal(onHover(document, 3, 10), null);
					assert.equal(onHover(document, 4, 12), null);
				});

				it("referenced variable \\$var", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL \\$var\nUSER \\$var\nWORKDIR \\$var");
					assert.equal(onHover(document, 1, 14), null);
					assert.equal(onHover(document, 2, 9), null);
					assert.equal(onHover(document, 3, 11), null);

					document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL \\$var\nUSER \\$var\nWORKDIR \\$var"
					);
					assert.equal(onHover(document, 2, 14), null);
					assert.equal(onHover(document, 3, 9), null);
					assert.equal(onHover(document, 4, 11), null);
				});
			});
		}

		createVariablesTest("ARG", "ARG", "=");

		function createCopyTest(trigger: boolean) {
			let onbuild = trigger ? "ONBUILD " : "";
			let triggerOffset = onbuild.length;

			describe("COPY", function() {
				it("--from", function() {
					let document = createDocument(onbuild + "COPY --from");
					let hover = onHover(document, 0, triggerOffset + 9);
					assert.notEqual(hover, null);
					assert.equal(hover, markdownDocumentation.getMarkdown("COPY_FlagFrom"));
				});

				it("--from=\\$x", function() {
					let document = createDocument(onbuild + "COPY --from=\\$x");
					let hover = onHover(document, 0, triggerOffset + 9);
					assert.notEqual(hover, null);
					assert.equal(hover, markdownDocumentation.getMarkdown("COPY_FlagFrom"));
				});

				it("--from=\\a", function() {
					let document = createDocument(onbuild + "COPY --from=\\a");
					let hover = onHover(document, 0, triggerOffset + 9);
					assert.notEqual(hover, null);
					assert.equal(hover, markdownDocumentation.getMarkdown("COPY_FlagFrom"));
				});

				it("--FROM", function() {
					let document = createDocument(onbuild + "COPY --FROM");
					let hover = onHover(document, 0, triggerOffset + 9);
					assert.equal(hover, null);
				});

				it("whitespace", function() {
					let document = createDocument(onbuild + "COPY  --from");
					let hover = onHover(document, 0, triggerOffset + 5);
					assert.equal(hover, null);
				});

				it("flag after", function() {
					let document = createDocument(onbuild + "COPY app --from=alpine app");
					let hover = onHover(document, 0, triggerOffset + 13);
					assert.equal(hover, null);

					document = createDocument(onbuild + "COPY app app --from=alpine");
					hover = onHover(document, 0, triggerOffset + 18);
					assert.equal(hover, null);
				});
			});
		}

		createCopyTest(false);

		describe("ENV", function() {
			createVariablesTest("equals delimiter", "ENV", "=");
			createVariablesTest("space delimiter", "ENV", " ");

			describe("single variable delimited by space", function() {
				it("${var}", function() {
					let document = createDocument("ENV aa bb cc dd\nRUN echo ${aa} ${cc}");
					let hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "bb cc dd");
					hover = onHover(document, 1, 12);
					assert.equal(hover.contents, "bb cc dd");
					assert.equal(onHover(document, 0, 11), null);
					assert.equal(onHover(document, 1, 18), null);

					document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo ${aa} ${cc}\n" +
						"FROM alpine\nRUN echo ${aa} ${cc}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "bb cc dd");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "bb cc dd");
					assert.equal(onHover(document, 1, 11), null);
					assert.equal(onHover(document, 2, 18), null);
					assert.equal(onHover(document, 4, 12), null);
					assert.equal(onHover(document, 4, 18), null);

					document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo ${aa} ${cc}\n" +
						"FROM alpine\nENV aa bb cc ee\nRUN echo ${aa} ${cc}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "bb cc dd");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "bb cc dd");
					assert.equal(onHover(document, 1, 11), null);
					assert.equal(onHover(document, 2, 18), null);
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "bb cc ee");
					hover = onHover(document, 5, 12);
					assert.equal(hover.contents, "bb cc ee");
					assert.equal(onHover(document, 4, 11), null);
					assert.equal(onHover(document, 5, 18), null);

					document = createDocument("ENV aa a  b\nRUN echo ${aa}");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 1, 12);
					assert.equal(hover.contents, "a  b");

					document = createDocument(
						"FROM alpine\nENV aa a  b\nRUN echo ${aa}\n" +
						"FROM alpine\nRUN echo ${aa}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "a  b");
					assert.equal(onHover(document, 4, 12), null);

					document = createDocument(
						"FROM alpine\nENV aa a  b\nRUN echo ${aa}\n" +
						"FROM alpine\nENV aa a  c\nRUN echo ${aa}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "a  c");
					hover = onHover(document, 5, 12);
					assert.equal(hover.contents, "a  c");
				});

				it("$var", function() {
					let document = createDocument("ENV aa bb cc dd\nRUN echo $aa $cc");
					let hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "bb cc dd");
					hover = onHover(document, 1, 11);
					assert.equal(hover.contents, "bb cc dd");
					assert.equal(onHover(document, 0, 11), null);
					assert.equal(onHover(document, 1, 15), null);

					document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo $aa $cc\n" +
						"FROM alpine\nRUN echo $aa $cc"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "bb cc dd");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "bb cc dd");
					assert.equal(onHover(document, 1, 11), null);
					assert.equal(onHover(document, 2, 15), null);
					assert.equal(onHover(document, 4, 11), null);
					assert.equal(onHover(document, 4, 15), null);

					document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo $aa $cc\n" +
						"FROM alpine\nENV aa bb cc ee\nRUN echo $aa $cc"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "bb cc dd");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "bb cc dd");
					assert.equal(onHover(document, 1, 11), null);
					assert.equal(onHover(document, 2, 15), null);
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "bb cc ee");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "bb cc ee");
					assert.equal(onHover(document, 4, 11), null);
					assert.equal(onHover(document, 5, 15), null);

					document = createDocument("ENV aa a  b\nRUN echo $aa");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 1, 11);
					assert.equal(hover.contents, "a  b");

					document = createDocument(
						"FROM alpine\nENV aa a  b\nRUN echo $aa\n" +
						"FROM alpine\nRUN echo $aa"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "a  b");
					assert.equal(onHover(document, 4, 11), null);

					document = createDocument(
						"FROM alpine\nENV aa a  b\nRUN echo $aa\n" +
						"FROM alpine\nENV aa a  c\nRUN echo $aa"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "a  c");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "a  c");
				});
			});
				
			describe("single variable delimited by escaped space", function() {
				it("${var}", function() {
					let document = createDocument("ENV xx a\\ b\nRUN echo ${xx}");
					let hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 1, 12);
					assert.equal(hover.contents, "a b");

					document = createDocument(
						"FROM alpine\nENV xx a\\ b\nRUN echo ${xx}\n" +
						"FROM alpine\nRUN echo ${xx}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "a b");
					assert.equal(onHover(document, 4, 12), null);

					document = createDocument(
						"FROM alpine\nENV xx a\\ b\nRUN echo ${xx}\n" +
						"FROM alpine\nENV xx a\\ c\nRUN echo ${xx}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "a c");
					hover = onHover(document, 5, 12);
					assert.equal(hover.contents, "a c");

					document = createDocument("ENV xx a\\ \\ b\nRUN echo ${xx}");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 1, 12);
					assert.equal(hover.contents, "a  b");

					document = createDocument(
						"FROM alpine\nENV xx a\\ \\ b\nRUN echo ${xx}\n" +
						"FROM alpine\nRUN echo ${xx}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "a  b");
					assert.equal(onHover(document, 4, 12), null);

					document = createDocument(
						"FROM alpine\nENV xx a\\ \\ b\nRUN echo ${xx}\n" +
						"FROM alpine\nENV xx a\\ \\ c\nRUN echo ${xx}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 12);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "a  c");
					hover = onHover(document, 5, 12);
					assert.equal(hover.contents, "a  c");
				});

				it("$var", function() {
					let document = createDocument("ENV xx a\\ b\nRUN echo $xx");
					let hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 1, 11);
					assert.equal(hover.contents, "a b");

					document = createDocument(
						"FROM alpine\nENV xx a\\ b\nRUN echo $xx\n" +
						"FROM alpine\nRUN echo $xx"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "a b");
					assert.equal(onHover(document, 4, 11), null);

					document = createDocument(
						"FROM alpine\nENV xx a\\ b\nRUN echo $xx\n" +
						"FROM alpine\nENV xx a\\ c\nRUN echo $xx"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "a b");
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "a c");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "a c");

					document = createDocument("ENV xx a\\ \\ b\nRUN echo $xx");
					hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 1, 11);
					assert.equal(hover.contents, "a  b");

					document = createDocument(
						"FROM alpine\nENV xx a\\ \\ b\nRUN echo $xx\n" +
						"FROM alpine\nRUN echo $xx"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "a  b");
					assert.equal(onHover(document, 4, 11), null);

					document = createDocument(
						"FROM alpine\nENV xx a\\ \\ b\nRUN echo $xx\n" +
						"FROM alpine\nENV xx a\\ \\ c\nRUN echo $xx"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 2, 11);
					assert.equal(hover.contents, "a  b");
					hover = onHover(document, 4, 5);
					assert.equal(hover.contents, "a  c");
					hover = onHover(document, 5, 11);
					assert.equal(hover.contents, "a  c");
				});
			});

			describe("reuse variable name", function() {

				/**
				 * ENV aa=x
				 * ENV aa=y bb=${aa}
				 * ENV cc=${aa}
				 */
				it("${var}", function() {
					let document = createDocument("ENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}");
					let hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 1, 15);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 2, 10);
					assert.equal(hover.contents, "y");

					document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}\n" +
						"FROM alpine\nENV cc=${aa}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 2, 5);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 2, 15);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 3, 10);
					assert.equal(hover.contents, "y");
					assert.equal(onHover(document, 5, 10), null);

					document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}\n" +
						"FROM alpine\nENV aa=a\nENV aa=b bb=${aa}\nENV cc=${aa}"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 2, 5);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 2, 15);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 3, 10);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 5, 5);
					assert.equal(hover.contents, "a");
					hover = onHover(document, 6, 5);
					assert.equal(hover.contents, "b");
					hover = onHover(document, 6, 15);
					assert.equal(hover.contents, "a");
					hover = onHover(document, 7, 10);
					assert.equal(hover.contents, "b");
				});

				/**
				 * ENV aa=x
				 * ENV aa=y bb=$aa
				 * ENV cc=$aa
				 */
				it("$var", function() {
					let document = createDocument("ENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa");
					let hover = onHover(document, 0, 5);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 1, 14);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 2, 9);
					assert.equal(hover.contents, "y");

					document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa\n" +
						"FROM alpine\nENV cc=$aa"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 2, 5);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 2, 14);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 3, 9);
					assert.equal(hover.contents, "y");
					assert.equal(onHover(document, 5, 9), null);

					document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa\n" +
						"FROM alpine\nENV aa=a\nENV aa=b bb=$aa\nENV cc=$aa"
					);
					hover = onHover(document, 1, 5);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 2, 5);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 2, 14);
					assert.equal(hover.contents, "x");
					hover = onHover(document, 3, 10);
					assert.equal(hover.contents, "y");
					hover = onHover(document, 5, 5);
					assert.equal(hover.contents, "a");
					hover = onHover(document, 6, 5);
					assert.equal(hover.contents, "b");
					hover = onHover(document, 6, 14);
					assert.equal(hover.contents, "a");
					hover = onHover(document, 7, 10);
					assert.equal(hover.contents, "b");
				});
			});

			describe("multiple variables", function() {
				it("${var}", function() {
					let document = createDocument("ENV var=value var2=value2\nRUN echo ${var} ${var2}");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 1, 12);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 0, 16);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 1, 20);

					document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 12);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 1, 2);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 3, 20);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 2, 2);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 3, 28);
					assert.equal(hover.contents, "value3");
				});

				it("$var", function() {
					let document = createDocument("ENV var=value var2=value2\nRUN echo ${var} ${var2}");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 1, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 0, 16);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 1, 17);

					document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 3, 11);
					assert.equal(hover.contents, "value");
					hover = onHover(document, 1, 2);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 3, 16);
					assert.equal(hover.contents, "value2");
					hover = onHover(document, 2, 2);
					assert.equal(hover.contents, "value3");
					hover = onHover(document, 3, 22);
					assert.equal(hover.contents, "value3");
				});
			});

			describe("escaped whitespace value", function() {
				it("ENV var=\\", function() {
					let document = createDocument("ENV var=\\");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "");

					document = createDocument("ENV var=\\ ");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "");

					document = createDocument("ENV var=\\  ");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "");
				});

				it("ENV var=\\  var2=\\", function() {
					let document = createDocument("ENV var=\\  var2=\\");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, " ");
					hover = onHover(document, 0, 13);
					assert.equal(hover.contents, "");

					document = createDocument("ENV var=\\  var2=\\ ");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, " ");
					hover = onHover(document, 0, 13);
					assert.equal(hover.contents, "");

					document = createDocument("ENV var=\\  var2=\\  ");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, " ");
					hover = onHover(document, 0, 13);
					assert.equal(hover.contents, "");
				});

				it("ENV var=\\   var2=\\", function() {
					let document = createDocument("ENV var=\\   var2=\\");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, " ");
					hover = onHover(document, 0, 14);
					assert.equal(hover.contents, "");

					document = createDocument("ENV var=\\   var2=\\ ");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, " ");
					hover = onHover(document, 0, 14);
					assert.equal(hover.contents, "");

					document = createDocument("ENV var=\\   var2=\\  ");
					hover = onHover(document, 0, 6);
					assert.equal(hover.contents, " ");
					hover = onHover(document, 0, 14);
					assert.equal(hover.contents, "");
				});

				it("ENV var=\\ \\  var2=\\", function() {
					let document = createDocument("ENV var=\\ \\  var2=\\");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "  ");
					hover = onHover(document, 0, 13);
					assert.equal(hover.contents, "");
				});

				it("ENV var=y\\  ", function() {
					let document = createDocument("ENV var=y\\  ");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "y");
				});
			});

			describe("escaped single quote", function() {
				it("ENV var='\\'", function() {
					let document = createDocument("ENV var='\\'");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "\\");
				});

				it("ENV var='\\\\'", function() {
					let document = createDocument("ENV var='\\\\'");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "\\\\");
				});

				it("ENV var='a\\\\nb'", function() {
					let document = createDocument("ENV var='a\\\nb'");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "ab");
				});

				it("ENV var='a\\ \\nb'", function() {
					let document = createDocument("ENV var='a\\ \nb'");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "ab");
				});

				it("ENV var='a\\  \\r\\nb'", function() {
					let document = createDocument("ENV var='a\\  \r\nb'");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "ab");
				});
			});

			describe("escaped double quotes", function() {
				it("ENV var=\"\\\"x\\\"\"", function() {
					let document = createDocument("ENV var=\"\\\"x\\\"\"");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "\"x\"");
				});

				it("ENV var='\"\\\"'", function() {
					let document = createDocument("ENV var='\"\\\"'");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "\"\\\"");
				});

				it("ENV var=\"a\\\\nb\"", function() {
					let document = createDocument("ENV var=\"a\\\nb\"");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "ab");
				});

				it("ENV var=\"a\\ \\nb\"", function() {
					let document = createDocument("ENV var=\"a\\ \nb\"");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "ab");
				});

				it("ENV var=\"a\\  \\r\\nb\"", function() {
					let document = createDocument("ENV var=\"a\\  \r\nb\"");
					let hover = onHover(document, 0, 6);
					assert.equal(hover.contents, "ab");
				});
			});
		});

		function createHealthcheckTest(trigger: boolean) {
			let onbuild = trigger ? "ONBUILD " : "";
			let triggerOffset = onbuild.length;

			describe("HEALTHCHECK", function() {
				it("--interval", function() {
					let document = createDocument(onbuild + "HEALTHCHECK --interval");
					let hover = onHover(document, 0, triggerOffset + 17);
					assert.equal(hover,  markdownDocumentation.getMarkdown("HEALTHCHECK_FlagInterval"));
				});

				it("--interval=\\$x", function() {
					let document = createDocument(onbuild + "HEALTHCHECK --interval=\\$x");
					let hover = onHover(document, 0, triggerOffset + 17);
					assert.equal(hover,  markdownDocumentation.getMarkdown("HEALTHCHECK_FlagInterval"));
				});

				it("--interval=\\a", function() {
					let document = createDocument(onbuild + "HEALTHCHECK --interval=\\a");
					let hover = onHover(document, 0, triggerOffset + 17);
					assert.equal(hover,  markdownDocumentation.getMarkdown("HEALTHCHECK_FlagInterval"));
				});

				it("--retries", function() {
					let document = createDocument(onbuild + "HEALTHCHECK --retries");
					let hover = onHover(document, 0, triggerOffset + 17);
					assert.equal(hover,  markdownDocumentation.getMarkdown("HEALTHCHECK_FlagRetries"));
				});

				it("--start-period", function() {
					let document = createDocument(onbuild + "HEALTHCHECK --start-period");
					let hover = onHover(document, 0, triggerOffset + 17);
					assert.equal(hover,  markdownDocumentation.getMarkdown("HEALTHCHECK_FlagStartPeriod"));
				});

				it("--timeout", function() {
					let document = createDocument(onbuild + "HEALTHCHECK --timeout");
					let hover = onHover(document, 0, triggerOffset + 17);
					assert.equal(hover,  markdownDocumentation.getMarkdown("HEALTHCHECK_FlagTimeout"));
				});

				it("--TIMEOUT", function() {
					let document = createDocument(onbuild + "HEALTHCHECK --TIMEOUT");
					let hover = onHover(document, 0, triggerOffset + 17);
					assert.equal(hover, null);
				});

				it("whitespace", function() {
					let document = createDocument(onbuild + "HEALTHCHECK  --timeout");
					let hover = onHover(document, 0, triggerOffset + 12);
					assert.equal(hover, null);
				});

				function createFlagsAfterTest(subcommand: string) {
					it("flags after " + subcommand, function() {
						let document = createDocument(onbuild + "HEALTHCHECK " + subcommand + " \\\n--interval=30s\\\n--retries=3\\\n--start-period=30s\\\n--timeout=30s");
						let hover = onHover(document, 1, 4);
						assert.equal(hover,  null);
						hover = onHover(document, 2, 4);
						assert.equal(hover,  null);
						hover = onHover(document, 3, 4);
						assert.equal(hover,  null);
						hover = onHover(document, 4, 4);
						assert.equal(hover,  null);
					});
				}

				createFlagsAfterTest("CMD");
				createFlagsAfterTest("NONE");
			});
		}

		createHealthcheckTest(false);

		describe("ONBUILD", function() {
			createCopyTest(true);
			createHealthcheckTest(true);
		});
	});

	describe("ARG and ENV", function() {
		describe("same variable name", function() {

			/**
			 * ARG aa=b
			 * ENV aa=c
			 * ARG aa=d
			 * RUN echo ${aa}
			 */
			it("${var}", function() {
				let document = createDocument("ARG aa=b\nENV aa=c\nARG aa=d\nRUN echo ${aa}");
				let hover = onHover(document, 3, 11);
				assert.equal(hover.contents, "c");

				document = createDocument(
					"FROM alpine\nARG aa=b\nENV aa=c\nARG aa=d\nRUN echo ${aa}\n" +
					"FROM alpine\nRUN echo ${aa}"
				);
				hover = onHover(document, 4, 11);
				assert.equal(hover.contents, "c");
				assert.equal(onHover(document, 6, 11), null);

				document = createDocument(
					"FROM alpine\nARG aa=b\nENV aa=c\nARG aa=d\nRUN echo ${aa}\n" +
					"FROM alpine\nARG aa=e\nENV aa=f\nARG aa=g\nRUN echo ${aa}"
				);
				hover = onHover(document, 4, 11);
				assert.equal(hover.contents, "c");
				hover = onHover(document, 9, 11);
				assert.equal(hover.contents, "f");
			});

			/**
			 * ARG aa=b
			 * ENV aa=c
			 * ARG aa=d
			 * RUN echo $aa
			 */
			it("${var}", function() {
				let document = createDocument("ARG aa=b\nENV aa=c\nARG aa=d\nRUN echo $aa");
				let hover = onHover(document, 3, 10);
				assert.equal(hover.contents, "c");

				document = createDocument(
					"FROM alpine\nARG aa=b\nENV aa=c\nARG aa=d\nRUN echo $aa\n" +
					"FROM alpine\nRUN echo ${aa}"
				);
				hover = onHover(document, 4, 10);
				assert.equal(hover.contents, "c");
				assert.equal(onHover(document, 6, 10), null);

				document = createDocument(
					"FROM alpine\nARG aa=b\nENV aa=c\nARG aa=d\nRUN echo $aa\n" +
					"FROM alpine\nARG aa=e\nENV aa=f\nARG aa=g\nRUN echo $aa"
				);
				hover = onHover(document, 4, 10);
				assert.equal(hover.contents, "c");
				hover = onHover(document, 9, 10);
				assert.equal(hover.contents, "f");
			});
		});
	});

	describe("keyword nesting", function() {
		it("ONBUILD EXPOSE", function() {
			let document = createDocument("ONBUILD EXPOSE 8080");
			let hover = onHover(document, 0, 11);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD expose 8080");
			hover = onHover(document, 0, 11);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD ExposE 8080");
			hover = onHover(document, 0, 11);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE escaped on newline", function() {
			let document = createDocument("ONBUILD \\\nEXPOSE 8080");
			let hover = onHover(document, 1, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD \\\rEXPOSE 8080");
			hover = onHover(document, 1, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD \\\r\nEXPOSE 8080");
			hover = onHover(document, 1, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("#escape=`\nONBUILD \\\nEXPOSE 8080");
			hover = onHover(document, 2, 3);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE escaped on newline with space", function() {
			let document = createDocument("ONBUILD \\\n EXPOSE 8080");
			let hover = onHover(document, 1, 4);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXPOSE incomplete", function() {
			let document = createDocument("ONBUILD EXPOSE");
			let hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD EXPOSE\n");
			hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD EXPOSE\r");
			hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));

			document = createDocument("ONBUILD EXPOSE\r\n");
			hover = onHover(document, 0, 9);
			assert.equal(hover, markdownDocumentation.getMarkdown("EXPOSE"));
		});

		it("ONBUILD EXP\\OSE", function() {
			let document = createDocument("ONBUILD EXPOS\\E");
			let hover = onHover(document, 0, 9);
			assert.equal(hover, null);
		});

		it("ONBUILD with no trigger", function() {
			let document = createDocument("ONBUILD   \r\n");
			let hover = onHover(document, 0, 9);
			assert.equal(hover, null);
		});

		it("invalid nesting", function() {
			let document = createDocument("RUN EXPOSE 8080");
			let hover = onHover(document, 0, 7);
			assert.equal(hover, null);

			document = createDocument(" RUN EXPOSE 8080");
			hover = onHover(document, 0, 8);
			assert.equal(hover, null);

			document = createDocument("\tRUN EXPOSE 8080");
			hover = onHover(document, 0, 8);
			assert.equal(hover, null);

			document = createDocument("\r\nRUN EXPOSE 8080");
			hover = onHover(document, 1, 7);
			assert.equal(hover, null);

			document = createDocument("\rRUN EXPOSE 8080");
			hover = onHover(document, 1, 7);
			assert.equal(hover, null);

			document = createDocument("\nRUN EXPOSE 8080");
			hover = onHover(document, 1, 7);
			assert.equal(hover, null);
		});
	});
});
