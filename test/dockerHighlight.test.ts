/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import {
	TextDocument, Range, Position, DocumentHighlight, DocumentHighlightKind
} from 'vscode-languageserver';
import { DockerHighlight } from '../src/dockerHighlight';

let highlighter = new DockerHighlight();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function computeHighlightRanges(document: TextDocument, line: number, character: number): DocumentHighlight[] {
	return highlighter.computeHighlightRanges(document, Position.create(line, character));
}

function assertHighlight(highlight: DocumentHighlight, kind: DocumentHighlightKind, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(highlight.kind, kind);
	assert.equal(highlight.range.start.line, startLine);
	assert.equal(highlight.range.start.character, startCharacter);
	assert.equal(highlight.range.end.line, endLine);
	assert.equal(highlight.range.end.character, endCharacter);
}

function assertHighlightRanges(actual: DocumentHighlight[], expected: DocumentHighlight[]) {
	assert.equal(actual.length, expected.length);
	for (let i = 0; i < actual.length; i++) {
		assertHighlightRange(actual[i], expected[i]);
	}
}

function assertHighlightRange(actual: DocumentHighlight, expected: DocumentHighlight) {
	assert.equal(actual.kind, expected.kind);
	assert.equal(actual.range.start.line, expected.range.start.line);
	assert.equal(actual.range.start.character, expected.range.start.character);
	assert.equal(actual.range.end.line, expected.range.end.line);
	assert.equal(actual.range.end.character, expected.range.end.character);
}

describe("Dockerfile Document Highlight tests", function() {
	describe("FROM", function() {
		describe("AS name", function() {
			it("no COPY", function() {
				let document = createDocument("FROM node AS bootstrap");
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
			});

			it("COPY", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor in the FROM
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);

				// cursor in the COPY
				ranges = computeHighlightRanges(document, 2, 16);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);
				
				document = createDocument("FROM node AS bootstrap\nFROM node AS bootstrap2\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				ranges = computeHighlightRanges(document, 1, 17);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 1, 13, 1, 23);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 22);

				// cursor in the COPY
				ranges = computeHighlightRanges(document, 2, 16);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 1, 13, 1, 23);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 22);
			});

			it("COPY incomplete", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap");
				// cursor in the FROM
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);

				// cursor in the COPY
				ranges = computeHighlightRanges(document, 2, 16);
				assert.equal(ranges.length, 2);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				assertHighlight(ranges[1], DocumentHighlightKind.Read, 2, 12, 2, 21);
			});

			it("source mismatch", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=other\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);

				// cursor in the COPY
				ranges = computeHighlightRanges(document, 3, 16);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Read, 3, 12, 3, 22);
			});
		});

		describe("invalid", function() {
			it("position", function() {
				let document = createDocument("FROM node AS bootstrap   \nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor after the AS source image
				let ranges = computeHighlightRanges(document, 0, 24);
				assert.equal(ranges.length, 0);
				// cursor after the COPY --from
				ranges = computeHighlightRanges(document, 2, 22);
				assert.equal(ranges.length, 0);
			});

			it("COPY bootstrap", function() {
				let document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor after the AS source image
				let ranges = computeHighlightRanges(document, 0, 17);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Write, 0, 13, 0, 22);
				// cursor on COPY bootstrap
				ranges = computeHighlightRanges(document, 1, 10);
				assert.equal(ranges.length, 0);
			});
		});
	});

	function createVariablesTest(testSuiteName: string, instruction: string, delimiter: string) {
		describe(testSuiteName, function() {
			it("referenced variable ${var}", function() {
				let arg = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 13), Position.create(1, 16)), DocumentHighlightKind.Read);
				let user = DocumentHighlight.create(Range.create(Position.create(2, 7), Position.create(2, 10)), DocumentHighlightKind.Read);
				let workdir = DocumentHighlight.create(Range.create(Position.create(3, 10), Position.create(3, 13)), DocumentHighlightKind.Read);
				let expected = [ arg, stopsignal, user, workdir ];
				let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 7);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);

				document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var2}\nWORKDIR ${var2}");
				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, [ arg, stopsignal ]);
			});

			it("referenced variable ${var} no value", function() {
				let arg = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 13), Position.create(1, 16)), DocumentHighlightKind.Read);
				let user = DocumentHighlight.create(Range.create(Position.create(2, 7), Position.create(2, 10)), DocumentHighlightKind.Read);
				let workdir = DocumentHighlight.create(Range.create(Position.create(3, 10), Position.create(3, 13)), DocumentHighlightKind.Read);
				let expected = [ arg, stopsignal, user, workdir ];
				let document = createDocument(instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 7);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);
			});

			it("referenced variable ${var:modifier}", function() {
				let arg = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 13), Position.create(1, 16)), DocumentHighlightKind.Read);
				let user = DocumentHighlight.create(Range.create(Position.create(2, 7), Position.create(2, 10)), DocumentHighlightKind.Read);
				let workdir = DocumentHighlight.create(Range.create(Position.create(3, 10), Position.create(3, 13)), DocumentHighlightKind.Read);
				let expected = [ arg, stopsignal, user, workdir ];
				let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var:+var}\nUSER ${var:+var}\nWORKDIR ${var:+var}");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 7);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);
				
				document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var:-var}\nUSER ${var:-var}\nWORKDIR ${var:-var}");
				ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 7);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);
			});

			it("referenced variable $var", function() {
				let arg = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 12), Position.create(1, 15)), DocumentHighlightKind.Read);
				let user = DocumentHighlight.create(Range.create(Position.create(2, 6), Position.create(2, 9)), DocumentHighlightKind.Read);
				let workdir = DocumentHighlight.create(Range.create(Position.create(3, 9), Position.create(3, 12)), DocumentHighlightKind.Read);
				let expected = [ arg, stopsignal, user, workdir ];
				let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 7);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);

				let run = DocumentHighlight.create(Range.create(Position.create(1, 11), Position.create(1, 14)), DocumentHighlightKind.Read);
				document = createDocument(instruction + " var" + delimiter + "value\nRUN echo \"$var\"");
				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, [ arg, run ]);

				document = createDocument(instruction + " var" + delimiter + "value\nRUN echo '$var'");
				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, [ arg, run ]);
			});

			it("referenced variable $var no value", function() {
				let arg = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 12), Position.create(1, 15)), DocumentHighlightKind.Read);
				let user = DocumentHighlight.create(Range.create(Position.create(2, 6), Position.create(2, 9)), DocumentHighlightKind.Read);
				let workdir = DocumentHighlight.create(Range.create(Position.create(3, 9), Position.create(3, 12)), DocumentHighlightKind.Read);
				let expected = [ arg, stopsignal, user, workdir ];
				let document = createDocument(instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 7);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);

				let run = DocumentHighlight.create(Range.create(Position.create(1, 11), Position.create(1, 14)), DocumentHighlightKind.Read);
				document = createDocument(instruction + " var\nRUN echo \"$var\"");
				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, [ arg, run ]);

				document = createDocument(instruction + " var\nRUN echo '$var'");
				ranges = computeHighlightRanges(document, 1, 13);
				assertHighlightRanges(ranges, [ arg, run ]);
			});

			it("repeated declaration $var", function() {
				let declaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let declaration2 = DocumentHighlight.create(Range.create(Position.create(1, 4), Position.create(1, 7)), DocumentHighlightKind.Write);
				let run = DocumentHighlight.create(Range.create(Position.create(2, 10), Position.create(2, 13)), DocumentHighlightKind.Read);
				let run2 = DocumentHighlight.create(Range.create(Position.create(3, 10), Position.create(3, 13)), DocumentHighlightKind.Read);
				let expected = [ declaration, declaration2, run, run2 ];
				let document = createDocument(instruction + " var=value\n" + instruction + " var=value\nRUN echo $var\nRUN echo $var");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 11);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);
			});

			it("repeated declaration $var no value", function() {
				let declaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let declaration2 = DocumentHighlight.create(Range.create(Position.create(1, 4), Position.create(1, 7)), DocumentHighlightKind.Write);
				let run = DocumentHighlight.create(Range.create(Position.create(2, 10), Position.create(2, 13)), DocumentHighlightKind.Read);
				let run2 = DocumentHighlight.create(Range.create(Position.create(3, 10), Position.create(3, 13)), DocumentHighlightKind.Read);
				let expected = [ declaration, declaration2, run, run2 ];
				let document = createDocument(instruction + " var\n" + instruction + " var\nRUN echo $var\nRUN echo $var");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 11);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);
			});

			it("repeated declaration ${var}", function() {
				let declaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let declaration2 = DocumentHighlight.create(Range.create(Position.create(1, 4), Position.create(1, 7)), DocumentHighlightKind.Write);
				let run = DocumentHighlight.create(Range.create(Position.create(2, 11), Position.create(2, 14)), DocumentHighlightKind.Read);
				let run2 = DocumentHighlight.create(Range.create(Position.create(3, 11), Position.create(3, 14)), DocumentHighlightKind.Read);
				let expected = [ declaration, declaration2, run, run2 ];
				let document = createDocument(instruction + " var=value\n" + instruction + " var=value\nRUN echo ${var}\nRUN echo ${var}");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 11);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 11);
				assertHighlightRanges(ranges, expected);
			});

			it("repeated declaration $var no value", function() {
				let declaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let declaration2 = DocumentHighlight.create(Range.create(Position.create(1, 4), Position.create(1, 7)), DocumentHighlightKind.Write);
				let run = DocumentHighlight.create(Range.create(Position.create(2, 11), Position.create(2, 14)), DocumentHighlightKind.Read);
				let run2 = DocumentHighlight.create(Range.create(Position.create(3, 11), Position.create(3, 14)), DocumentHighlightKind.Read);
				let expected = [ declaration, declaration2, run, run2 ];
				let document = createDocument(instruction + " var\n" + instruction + " var\nRUN echo ${var}\nRUN echo ${var}");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 1, 5);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 2, 12);
				assertHighlightRanges(ranges, expected);

				ranges = computeHighlightRanges(document, 3, 12);
				assertHighlightRanges(ranges, expected);
			});
		});
	}

	createVariablesTest("ARG", "ARG", "=");

	describe("ENV", function() {
		createVariablesTest("equals delimiter", "ENV", "=");
		createVariablesTest("space delimiter", "ENV", " ");

		describe("single variable delimited by space", function() {
			it("${var}", function() {
				let varDeclaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 6)), DocumentHighlightKind.Write);
				let varReference = DocumentHighlight.create(Range.create(Position.create(1, 11), Position.create(1, 13)), DocumentHighlightKind.Read);
				let document = createDocument("ENV aa bb cc dd\nRUN echo ${aa} ${cc}");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 1, 12);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 0, 11);
				assert.equal(ranges.length, 0);
				ranges = computeHighlightRanges(document, 1, 18);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 17, 1, 19);
			});

			it("$var", function() {
				let varDeclaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 6)), DocumentHighlightKind.Write);
				let varReference = DocumentHighlight.create(Range.create(Position.create(1, 10), Position.create(1, 12)), DocumentHighlightKind.Read);
				let document = createDocument("ENV aa bb cc dd\nRUN echo $aa $cc");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 1, 11);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 0, 11);
				assert.equal(ranges.length, 0);
				ranges = computeHighlightRanges(document, 1, 15);
				assert.equal(ranges.length, 1);
				assertHighlight(ranges[0], DocumentHighlightKind.Read, 1, 14, 1, 16);
			});
		});

		describe("multiple variables", function() {
			it("${var}", function() {
				let varDeclaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let varDeclaration2 = DocumentHighlight.create(Range.create(Position.create(0, 14), Position.create(0, 18)), DocumentHighlightKind.Write);
				let varReference = DocumentHighlight.create(Range.create(Position.create(1, 11), Position.create(1, 14)), DocumentHighlightKind.Read);
				let varReference2 = DocumentHighlight.create(Range.create(Position.create(1, 18), Position.create(1, 22)), DocumentHighlightKind.Read);
				let document = createDocument("ENV var=value var2=value2\nRUN echo ${var} ${var2}");
				let ranges = computeHighlightRanges(document, 0, 6);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 1, 12);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 0, 16);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				ranges = computeHighlightRanges(document, 1, 20);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				
				varDeclaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				varDeclaration2 = DocumentHighlight.create(Range.create(Position.create(1, 0), Position.create(1, 4)), DocumentHighlightKind.Write);
				let varDeclaration3 = DocumentHighlight.create(Range.create(Position.create(2, 0), Position.create(2, 4)), DocumentHighlightKind.Write);
				varReference = DocumentHighlight.create(Range.create(Position.create(3, 11), Position.create(3, 14)), DocumentHighlightKind.Read);
				varReference2 = DocumentHighlight.create(Range.create(Position.create(3, 18), Position.create(3, 22)), DocumentHighlightKind.Read);
				let varReference3 = DocumentHighlight.create(Range.create(Position.create(3, 26), Position.create(3, 30)), DocumentHighlightKind.Read);
				document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}");
				ranges = computeHighlightRanges(document, 0, 6);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 3, 12);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 1, 2);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				ranges = computeHighlightRanges(document, 3, 20);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				ranges = computeHighlightRanges(document, 2, 2);
				assertHighlightRanges(ranges, [ varDeclaration3, varReference3 ]);
				ranges = computeHighlightRanges(document, 3, 29);
				assertHighlightRanges(ranges, [ varDeclaration3, varReference3 ]);
			});

			it("$var", function() {
				let varDeclaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				let varDeclaration2 = DocumentHighlight.create(Range.create(Position.create(0, 14), Position.create(0, 18)), DocumentHighlightKind.Write);
				let varReference = DocumentHighlight.create(Range.create(Position.create(1, 10), Position.create(1, 13)), DocumentHighlightKind.Read);
				let varReference2 = DocumentHighlight.create(Range.create(Position.create(1, 15), Position.create(1, 19)), DocumentHighlightKind.Read);
				let document = createDocument("ENV var=value var2=value2\nRUN echo $var $var2");
				let ranges = computeHighlightRanges(document, 0, 6);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 1, 12);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 0, 16);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				ranges = computeHighlightRanges(document, 1, 18);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				
				varDeclaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
				varDeclaration2 = DocumentHighlight.create(Range.create(Position.create(1, 0), Position.create(1, 4)), DocumentHighlightKind.Write);
				let varDeclaration3 = DocumentHighlight.create(Range.create(Position.create(2, 0), Position.create(2, 4)), DocumentHighlightKind.Write);
				varReference = DocumentHighlight.create(Range.create(Position.create(3, 10), Position.create(3, 13)), DocumentHighlightKind.Read);
				varReference2 = DocumentHighlight.create(Range.create(Position.create(3, 15), Position.create(3, 19)), DocumentHighlightKind.Read);
				let varReference3 = DocumentHighlight.create(Range.create(Position.create(3, 21), Position.create(3, 25)), DocumentHighlightKind.Read);
				document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3");
				ranges = computeHighlightRanges(document, 0, 6);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 3, 12);
				assertHighlightRanges(ranges, [ varDeclaration, varReference ]);
				ranges = computeHighlightRanges(document, 1, 2);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				ranges = computeHighlightRanges(document, 3, 18);
				assertHighlightRanges(ranges, [ varDeclaration2, varReference2 ]);
				ranges = computeHighlightRanges(document, 2, 2);
				assertHighlightRanges(ranges, [ varDeclaration3, varReference3 ]);
				ranges = computeHighlightRanges(document, 3, 24);
				assertHighlightRanges(ranges, [ varDeclaration3, varReference3 ]);
			});
		});

		describe("reuse variable name", function() {

			/**
			 * ENV aa=x
			 * ENV aa=y bb=${aa}
			 * ENV cc=${aa}
			 */
			it("${var}", function() {
				let declaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 6)), DocumentHighlightKind.Write);
				let write = DocumentHighlight.create(Range.create(Position.create(1, 4), Position.create(1, 6)), DocumentHighlightKind.Write);
				let read = DocumentHighlight.create(Range.create(Position.create(1, 14), Position.create(1, 16)), DocumentHighlightKind.Read);
				let read2 = DocumentHighlight.create(Range.create(Position.create(2, 9), Position.create(2, 11)), DocumentHighlightKind.Read);
				let document = createDocument("ENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
				ranges = computeHighlightRanges(document, 1, 5);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
				ranges = computeHighlightRanges(document, 1, 15);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
				ranges = computeHighlightRanges(document, 2, 10);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
			});

			/**
			 * ENV aa=x
			 * ENV aa=y bb=$aa
			 * ENV cc=$aa
			 */
			it("$var", function() {
				let declaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 6)), DocumentHighlightKind.Write);
				let write = DocumentHighlight.create(Range.create(Position.create(1, 4), Position.create(1, 6)), DocumentHighlightKind.Write);
				let read = DocumentHighlight.create(Range.create(Position.create(1, 13), Position.create(1, 15)), DocumentHighlightKind.Read);
				let read2 = DocumentHighlight.create(Range.create(Position.create(2, 8), Position.create(2, 10)), DocumentHighlightKind.Read);
				let document = createDocument("ENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa");
				let ranges = computeHighlightRanges(document, 0, 5);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
				ranges = computeHighlightRanges(document, 1, 5);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
				ranges = computeHighlightRanges(document, 1, 14);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
				ranges = computeHighlightRanges(document, 2, 9);
				assertHighlightRanges(ranges, [ declaration, write, read, read2] );
			});
		});

		it("empty ARG", function() {
			let declaration = DocumentHighlight.create(Range.create(Position.create(0, 4), Position.create(0, 7)), DocumentHighlightKind.Write);
			let document = createDocument("ENV var=value\nARG");
			let ranges = computeHighlightRanges(document, 0, 5);
			assertHighlightRanges(ranges, [ declaration ]);
		});
	});

	describe("non-existent variable", function() {
		it("${var}", function() {
			let stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 13), Position.create(1, 16)), DocumentHighlightKind.Read);
			let user = DocumentHighlight.create(Range.create(Position.create(2, 7), Position.create(2, 10)), DocumentHighlightKind.Read);
			let workdir = DocumentHighlight.create(Range.create(Position.create(3, 10), Position.create(3, 13)), DocumentHighlightKind.Read);
			let expected = [ stopsignal, user, workdir ];
			let document = createDocument("FROM busybox\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
			let ranges = computeHighlightRanges(document, 1, 13);
			assertHighlightRanges(ranges, expected);

			ranges = computeHighlightRanges(document, 2, 7);
			assertHighlightRanges(ranges, expected);

			ranges = computeHighlightRanges(document, 3, 11);
			assertHighlightRanges(ranges, expected);
		});

		it("$var", function() {
			let stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 12), Position.create(1, 15)), DocumentHighlightKind.Read);
			let user = DocumentHighlight.create(Range.create(Position.create(2, 6), Position.create(2, 9)), DocumentHighlightKind.Read);
			let workdir = DocumentHighlight.create(Range.create(Position.create(3, 9), Position.create(3, 12)), DocumentHighlightKind.Read);
			let expected = [ stopsignal, user, workdir ];
			let document = createDocument("FROM busybox\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
			let ranges = computeHighlightRanges(document, 1, 13);
			assertHighlightRanges(ranges, expected);

			ranges = computeHighlightRanges(document, 2, 7);
			assertHighlightRanges(ranges, expected);

			ranges = computeHighlightRanges(document, 3, 11);
			assertHighlightRanges(ranges, expected);

			stopsignal = DocumentHighlight.create(Range.create(Position.create(1, 12), Position.create(1, 16)), DocumentHighlightKind.Read);
			document = createDocument("FROM busybox\nSTOPSIGNAL $var2\nUSER $var\nWORKDIR $var");
			ranges = computeHighlightRanges(document, 1, 13);
			assertHighlightRanges(ranges, [ stopsignal ]);

			let run = DocumentHighlight.create(Range.create(Position.create(0, 11), Position.create(0, 14)), DocumentHighlightKind.Read);
			document = createDocument("RUN echo \"$var\"");
			ranges = computeHighlightRanges(document, 0, 12);
			assertHighlightRanges(ranges, [ run ]);

			document = createDocument("RUN echo '$var'");
			ranges = computeHighlightRanges(document, 0, 12);
			assertHighlightRanges(ranges, [ run ]);
		});
	});
});
