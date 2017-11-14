/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, Range, Position, TextEdit } from 'vscode-languageserver';
import { DockerRename } from '../src/dockerRename';

let renameSupport = new DockerRename();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function rename(document: TextDocument, line: number, character: number, newName: string): TextEdit[] {
	return renameSupport.rename(document, Position.create(line, character), newName);
}

function assertEdit(edit: TextEdit, newName: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(edit.newText, newName);
	assert.equal(edit.range.start.line, startLine);
	assert.equal(edit.range.start.character, startCharacter);
	assert.equal(edit.range.end.line, endLine);
	assert.equal(edit.range.end.character, endCharacter);
}

function assertEdits(actualEdits: TextEdit[], expectedEdits: TextEdit[]) {
	assert.equal(actualEdits.length, expectedEdits.length);
	for (let i = 0; i < actualEdits.length; i++) {
		assertEdit(
			actualEdits[i],
			expectedEdits[i].newText,
			expectedEdits[i].range.start.line,
			expectedEdits[i].range.start.character,
			expectedEdits[i].range.end.line,
			expectedEdits[i].range.end.character
		);
	}
}

describe("Dockerfile Document Rename tests", function() {
	describe("FROM", function() {
		describe("AS name", function() {
			it("no COPY", function() {
				let document = createDocument("FROM node AS bootstrap");
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(1, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
			});

			it("COPY", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor in the FROM
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);

				// cursor in the COPY
				edits = rename(document, 2, 16, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);
			});

			it("COPY incomplete", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap");
				// cursor in the FROM
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);

				// cursor in the COPY
				edits = rename(document, 2, 16, "renamed");
				assert.equal(2, edits.length);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
				assertEdit(edits[1], "renamed", 2, 12, 2, 21);
			});

			it("source mismatch", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				let edits = rename(document, 0, 17, "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);

				// cursor in the COPY
				edits = rename(document, 2, 16, "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 2, 12, 2, 22);

				document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor in the FROM
				edits = rename(document, 0, 17, "renamed");
				assert.equal(edits.length, 1);
				assertEdit(edits[0], "renamed", 0, 13, 0, 22);
			});
		});

		describe("invalid", function() {
			it("position", function() {
				let document = createDocument("FROM node AS bootstrap   \nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor after the AS source image
				let edits = rename(document, 0, 24, "renamed");
				assert.equal(edits.length, 0);
				// cursor after the COPY --from
				edits = rename(document, 2, 22, "renamed");
				assert.equal(edits.length, 0);
			});

			it("COPY bootstrap", function() {
				let document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor on COPY bootstrap
				let edits = rename(document, 1, 10, "renamed");
				assert.equal(edits.length, 0);
			});
		});
	});

	function createVariablesTest(testSuiteName: string, instruction: string, delimiter: string) {
		describe(testSuiteName, function() {
			describe("no FROM", function() {
				it("referenced variable ${var}", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
	
					edits = rename(document, 1, 13, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
	
					edits = rename(document, 2, 7, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
	
					edits = rename(document, 3, 11, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
				});
	
				it("referenced variable ${var} no value", function() {
					let document = createDocument(instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
	
					edits = rename(document, 1, 13, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
	
					edits = rename(document, 2, 7, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
	
					edits = rename(document, 3, 11, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 13, 1, 16);
					assertEdit(edits[2], "renamed", 2, 7, 2, 10);
					assertEdit(edits[3], "renamed", 3, 10, 3, 13);
				});
	
				it("referenced variable $var", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 1, 13, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 2, 7, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 3, 11, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 4, 12, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 5, 13, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
				});
	
				it("referenced variable $var no value", function() {
					let document = createDocument(instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 1, 13, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 2, 7, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 3, 11, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 4, 12, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
	
					edits = rename(document, 5, 13, "renamed");
					assert.equal(edits.length, 6);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 12, 1, 15);
					assertEdit(edits[2], "renamed", 2, 6, 2, 9);
					assertEdit(edits[3], "renamed", 3, 9, 3, 12);
					assertEdit(edits[4], "renamed", 4, 11, 4, 14);
					assertEdit(edits[5], "renamed", 5, 11, 5, 14);
				});

				it("$var in LABEL value with single quotes", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nLABEL label='$var'");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);

					edits = rename(document, 1, 15, "renamed");
					assert.equal(edits.length, 0);
				});

				it("$var in LABEL value with double quotes", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nLABEL label=\"$var\"");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 14, 1, 17);

					edits = rename(document, 1, 15, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 14, 1, 17);
				});

				it("${var} in LABEL value with single quotes", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nLABEL label='${var}'");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);

					edits = rename(document, 1, 17, "renamed");
					assert.equal(edits.length, 0);
				});

				it("${var} in LABEL value with double quotes", function() {
					let document = createDocument(instruction + " var" + delimiter + "value\nLABEL label=\"${var}\"");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 15, 1, 18);

					edits = rename(document, 1, 17, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 15, 1, 18);
				});

				it("multiline reference \\n", function() {
					let document = createDocument(instruction + " port=8080\nEXPOSE ${po\\\nrt}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 1, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					document = createDocument("#escape=`\n" + instruction + " port=8080\nEXPOSE ${po`\nrt}");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 2, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					document = createDocument(instruction + " port=8080\nEXPOSE $po\\\nrt");
					edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 1, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					document = createDocument("#escape=`\n" + instruction + " port=8080\nEXPOSE $po`\nrt");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 2, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);
				});

				it("multiline reference \\r\\n", function() {
					let document = createDocument(instruction + " port=8080\r\nEXPOSE ${po\\\r\nrt}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 1, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					document = createDocument("#escape=`\r\n" + instruction + " port=8080\r\nEXPOSE ${po`\r\nrt}");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 2, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					document = createDocument(instruction + " port=8080\r\nEXPOSE $po\\\r\nrt");
					edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 1, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					document = createDocument("#escape=`\r\n" + instruction + " port=8080\r\nEXPOSE $po`\r\nrt");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 2, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);
				});

				it("multiline reference \\n spaced", function() {
					let document = createDocument(instruction + " port=8080\nEXPOSE ${po\\ \t\nrt}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 1, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					document = createDocument("#escape=`\n" + instruction + " port=8080\nEXPOSE ${po` \t\nrt}");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 2, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					document = createDocument(instruction + " port=8080\nEXPOSE $po\\ \t\nrt");
					edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 1, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					document = createDocument("#escape=`\n" + instruction + " port=8080\nEXPOSE $po` \t\nrt");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 2, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);
				});

				it("multiline reference \\r\\n spaced", function() {
					let document = createDocument(instruction + " port=8080\r\nEXPOSE ${po\\ \t\r\nrt}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 1, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 9, 2, 2);

					document = createDocument("#escape=`\r\n" + instruction + " port=8080\r\nEXPOSE ${po` \t\r\nrt}");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 2, 10, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 9, 3, 2);

					document = createDocument(instruction + " port=8080\r\nEXPOSE $po\\ \t\r\nrt");
					edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 1, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					edits = rename(document, 2, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 8);
					assertEdit(edits[1], "renamed", 1, 8, 2, 2);

					document = createDocument("#escape=`\r\n" + instruction + " port=8080\r\nEXPOSE $po` \t\r\nrt");
					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 2, 9, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);

					edits = rename(document, 3, 1, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 8);
					assertEdit(edits[1], "renamed", 2, 8, 3, 2);
				});
			});

			describe("build stage", function() {
				it("referenced variable ${var}", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(2, 13, 2, 16), "renamed"),
						TextEdit.replace(Range.create(3, 7, 3, 10), "renamed"),
						TextEdit.replace(Range.create(4, 10, 4, 13), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(6, 4, 6, 7), "renamed"),
						TextEdit.replace(Range.create(7, 13, 7, 16), "renamed"),
						TextEdit.replace(Range.create(8, 7, 8, 10), "renamed"),
						TextEdit.replace(Range.create(9, 10, 9, 13), "renamed")
					];
					let document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 2, 13, "renamed"), expectedEdits);
					assertEdits(rename(document, 3, 7, "renamed"), expectedEdits);
					assertEdits(rename(document, 4, 11, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 7, 13, "renamed"), expectedEdits2);
					assertEdits(rename(document, 8, 7, "renamed"), expectedEdits2);
					assertEdits(rename(document, 9, 11, "renamed"), expectedEdits2);
				});
	
				it("referenced variable ${var} no value", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(2, 13, 2, 16), "renamed"),
						TextEdit.replace(Range.create(3, 7, 3, 10), "renamed"),
						TextEdit.replace(Range.create(4, 10, 4, 13), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(6, 4, 6, 7), "renamed"),
						TextEdit.replace(Range.create(7, 13, 7, 16), "renamed"),
						TextEdit.replace(Range.create(8, 7, 8, 10), "renamed"),
						TextEdit.replace(Range.create(9, 10, 9, 13), "renamed")
					];
					let document = createDocument(
						"FROM alpine\n" + instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
						"FROM alpine\n" + instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 2, 13, "renamed"), expectedEdits);
					assertEdits(rename(document, 3, 7, "renamed"), expectedEdits);
					assertEdits(rename(document, 4, 11, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 7, 13, "renamed"), expectedEdits2);
					assertEdits(rename(document, 8, 7, "renamed"), expectedEdits2);
					assertEdits(rename(document, 9, 11, "renamed"), expectedEdits2);
				});
	
				it("referenced variable $var", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(2, 12, 2, 15), "renamed"),
						TextEdit.replace(Range.create(3, 6, 3, 9), "renamed"),
						TextEdit.replace(Range.create(4, 9, 4, 12), "renamed"),
						TextEdit.replace(Range.create(5, 11, 5, 14), "renamed"),
						TextEdit.replace(Range.create(6, 11, 6, 14), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(8, 4, 8, 7), "renamed"),
						TextEdit.replace(Range.create(9, 12, 9, 15), "renamed"),
						TextEdit.replace(Range.create(10, 6, 10, 9), "renamed"),
						TextEdit.replace(Range.create(11, 9, 11, 12), "renamed"),
						TextEdit.replace(Range.create(12, 11, 12, 14), "renamed"),
						TextEdit.replace(Range.create(13, 11, 13, 14), "renamed")
					];
					let document = createDocument(
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'\n" +
						"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 2, 13, "renamed"), expectedEdits);
					assertEdits(rename(document, 3, 7, "renamed"), expectedEdits);
					assertEdits(rename(document, 4, 11, "renamed"), expectedEdits);
					assertEdits(rename(document, 5, 12, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 13, "renamed"), expectedEdits);
					assertEdits(rename(document, 8, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 9, 13, "renamed"), expectedEdits2);
					assertEdits(rename(document, 10, 7, "renamed"), expectedEdits2);
					assertEdits(rename(document, 11, 11, "renamed"), expectedEdits2);
					assertEdits(rename(document, 12, 12, "renamed"), expectedEdits2);
					assertEdits(rename(document, 13, 13, "renamed"), expectedEdits2);
				});
	
				it("referenced variable $var no value", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(2, 12, 2, 15), "renamed"),
						TextEdit.replace(Range.create(3, 6, 3, 9), "renamed"),
						TextEdit.replace(Range.create(4, 9, 4, 12), "renamed"),
						TextEdit.replace(Range.create(5, 11, 5, 14), "renamed"),
						TextEdit.replace(Range.create(6, 11, 6, 14), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(8, 4, 8, 7), "renamed"),
						TextEdit.replace(Range.create(9, 12, 9, 15), "renamed"),
						TextEdit.replace(Range.create(10, 6, 10, 9), "renamed"),
						TextEdit.replace(Range.create(11, 9, 11, 12), "renamed"),
						TextEdit.replace(Range.create(12, 11, 12, 14), "renamed"),
						TextEdit.replace(Range.create(13, 11, 13, 14), "renamed")
					];
					let document = createDocument(
						"FROM alpine\n" + instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'\n" +
						"FROM alpine\n" + instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\nRUN echo \"$var\"\nRUN echo '$var'"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 2, 13, "renamed"), expectedEdits);
					assertEdits(rename(document, 3, 7, "renamed"), expectedEdits);
					assertEdits(rename(document, 4, 11, "renamed"), expectedEdits);
					assertEdits(rename(document, 5, 12, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 13, "renamed"), expectedEdits);
					assertEdits(rename(document, 8, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 9, 13, "renamed"), expectedEdits2);
					assertEdits(rename(document, 10, 7, "renamed"), expectedEdits2);
					assertEdits(rename(document, 11, 11, "renamed"), expectedEdits2);
					assertEdits(rename(document, 12, 12, "renamed"), expectedEdits2);
					assertEdits(rename(document, 13, 13, "renamed"), expectedEdits2);
				});

				it("$var in LABEL value with single quotes", function() {
					let document = createDocument("FROM alpine\n" + instruction + " var" + delimiter + "value\nLABEL label='$var'");
					let edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 1, 4, 1, 7);

					edits = rename(document, 2, 15, "renamed");
					assert.equal(edits.length, 0);
				});

				it("$var in LABEL value with double quotes", function() {
					let document = createDocument("FROM alpine\n" + instruction + " var" + delimiter + "value\nLABEL label=\"$var\"");
					let edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 7);
					assertEdit(edits[1], "renamed", 2, 14, 2, 17);

					edits = rename(document, 2, 15, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 7);
					assertEdit(edits[1], "renamed", 2, 14, 2, 17);
				});

				it("${var} in LABEL value with single quotes", function() {
					let document = createDocument("FROM alpine\n" + instruction + " var" + delimiter + "value\nLABEL label='${var}'");
					let edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 1, 4, 1, 7);

					edits = rename(document, 2, 17, "renamed");
					assert.equal(edits.length, 0);
				});

				it("${var} in LABEL value with double quotes", function() {
					let document = createDocument("FROM alpine\n" + instruction + " var" + delimiter + "value\nLABEL label=\"${var}\"");
					let edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 7);
					assertEdit(edits[1], "renamed", 2, 15, 2, 18);

					edits = rename(document, 2, 17, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 4, 1, 7);
					assertEdit(edits[1], "renamed", 2, 15, 2, 18);
				});
			});
		});
	}

	createVariablesTest("ARG", "ARG", "=");

	describe("ENV", function() {
		createVariablesTest("equals delimiter", "ENV", "=");
		createVariablesTest("space delimiter", "ENV", " ");

		describe("no FROM", function() {
			describe("single variable delimited by space", function() {
				it("${var}", function() {
					let document = createDocument("ENV aa bb cc dd\nRUN echo ${aa} ${cc}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 11, 1, 13);

					edits = rename(document, 1, 12, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 11, 1, 13);

					edits = rename(document, 0, 11, "renamed");
					assert.equal(edits.length, 0);

					edits = rename(document, 1, 18, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 1, 17, 1, 19);
				});

				it("$var", function() {
					let document = createDocument("ENV aa bb cc dd\nRUN echo $aa $cc");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 10, 1, 12);

					edits = rename(document, 1, 11, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 10, 1, 12);

					edits = rename(document, 0, 11, "renamed");
					assert.equal(edits.length, 0);

					edits = rename(document, 1, 15, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 1, 14, 1, 16);
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
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 14, 1, 16);
					assertEdit(edits[3], "renamed", 2, 9, 2, 11);

					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 14, 1, 16);
					assertEdit(edits[3], "renamed", 2, 9, 2, 11);

					edits = rename(document, 1, 15, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 14, 1, 16);
					assertEdit(edits[3], "renamed", 2, 9, 2, 11);

					edits = rename(document, 2, 10, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 14, 1, 16);
					assertEdit(edits[3], "renamed", 2, 9, 2, 11);
				});

				/**
				 * ENV aa=x
				 * ENV aa=y bb=$aa
				 * ENV cc=$aa
				 */
				it("$var", function() {
					let document = createDocument("ENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 13, 1, 15);
					assertEdit(edits[3], "renamed", 2, 8, 2, 10);

					edits = rename(document, 1, 5, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 13, 1, 15);
					assertEdit(edits[3], "renamed", 2, 8, 2, 10);

					edits = rename(document, 1, 14, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 13, 1, 15);
					assertEdit(edits[3], "renamed", 2, 8, 2, 10);

					edits = rename(document, 2, 9, "renamed");
					assert.equal(edits.length, 4);
					assertEdit(edits[0], "renamed", 0, 4, 0, 6);
					assertEdit(edits[1], "renamed", 1, 4, 1, 6);
					assertEdit(edits[2], "renamed", 1, 13, 1, 15);
					assertEdit(edits[3], "renamed", 2, 8, 2, 10);
				});
			});

			describe("multiple variables", function() {
				it("${var}", function() {
					let document = createDocument("ENV var=value var2=value2\nRUN echo ${var} ${var2}");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 11, 1, 14);

					edits = rename(document, 1, 12, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 11, 1, 14);

					edits = rename(document, 0, 16, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 14, 0, 18);
					assertEdit(edits[1], "renamed", 1, 18, 1, 22);

					edits = rename(document, 1, 20, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 14, 0, 18);
					assertEdit(edits[1], "renamed", 1, 18, 1, 22);

					document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}");
					edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 3, 11, 3, 14);

					edits = rename(document, 3, 12, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 3, 11, 3, 14);

					edits = rename(document, 1, 2, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 0, 1, 4);
					assertEdit(edits[1], "renamed", 3, 18, 3, 22);

					edits = rename(document, 3, 20, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 0, 1, 4);
					assertEdit(edits[1], "renamed", 3, 18, 3, 22);

					edits = rename(document, 2, 2, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 2, 0, 2, 4);
					assertEdit(edits[1], "renamed", 3, 26, 3, 30);

					edits = rename(document, 3, 28, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 2, 0, 2, 4);
					assertEdit(edits[1], "renamed", 3, 26, 3, 30);
				});

				it("$var", function() {
					let document = createDocument("ENV var=value var2=value2\nRUN echo $var $var2");
					let edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 10, 1, 13);

					edits = rename(document, 1, 12, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 1, 10, 1, 13);

					edits = rename(document, 0, 16, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 14, 0, 18);
					assertEdit(edits[1], "renamed", 1, 15, 1, 19);

					edits = rename(document, 1, 16, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 14, 0, 18);
					assertEdit(edits[1], "renamed", 1, 15, 1, 19);

					document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3");
					edits = rename(document, 0, 5, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 3, 10, 3, 13);

					edits = rename(document, 3, 12, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 0, 4, 0, 7);
					assertEdit(edits[1], "renamed", 3, 10, 3, 13);

					edits = rename(document, 1, 2, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 0, 1, 4);
					assertEdit(edits[1], "renamed", 3, 15, 3, 19);

					edits = rename(document, 3, 16, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 1, 0, 1, 4);
					assertEdit(edits[1], "renamed", 3, 15, 3, 19);

					edits = rename(document, 2, 2, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 2, 0, 2, 4);
					assertEdit(edits[1], "renamed", 3, 21, 3, 25);

					edits = rename(document, 3, 22, "renamed");
					assert.equal(edits.length, 2);
					assertEdit(edits[0], "renamed", 2, 0, 2, 4);
					assertEdit(edits[1], "renamed", 3, 21, 3, 25);
				});
			});
		});

		describe("build stage", function() {
			describe("single variable delimited by space", function() {
				it("${var}", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 6), "renamed"),
						TextEdit.replace(Range.create(2, 11, 2, 13), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(4, 4, 4, 6), "renamed"),
						TextEdit.replace(Range.create(5, 11, 5, 13), "renamed")
					];
					let document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo ${aa} ${cc}\n" +
						"FROM alpine\nENV aa bb cc dd\nRUN echo ${aa} ${cc}"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 4, 5, "renamed"), expectedEdits2);

					assertEdits(rename(document, 2, 12, "renamed"), expectedEdits);
					assertEdits(rename(document, 5, 12, "renamed"), expectedEdits2);

					assert.equal(rename(document, 1, 11, "renamed").length, 0);
					assert.equal(rename(document, 4, 11, "renamed").length, 0);

					let edits = rename(document, 2, 18, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 2, 17, 2, 19);
					edits = rename(document, 5, 18, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 5, 17, 5, 19);
				});

				it("$var", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 6), "renamed"),
						TextEdit.replace(Range.create(2, 10, 2, 12), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(4, 4, 4, 6), "renamed"),
						TextEdit.replace(Range.create(5, 10, 5, 12), "renamed")
					];
					let document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo $aa $cc\n" +
						"FROM alpine\nENV aa bb cc dd\nRUN echo $aa $cc"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 4, 5, "renamed"), expectedEdits2);

					assertEdits(rename(document, 2, 11, "renamed"), expectedEdits);
					assertEdits(rename(document, 5, 11, "renamed"), expectedEdits2);

					assert.equal(rename(document, 1, 11, "renamed").length, 0);
					assert.equal(rename(document, 4, 11, "renamed").length, 0);

					let edits = rename(document, 2, 15, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 2, 14, 2, 16);
					edits = rename(document, 5, 15, "renamed");
					assert.equal(edits.length, 1);
					assertEdit(edits[0], "renamed", 5, 14, 5, 16);
				});
			});

			describe("reuse variable name build stage", function() {

				/**
				 * ENV aa=x
				 * ENV aa=y bb=${aa}
				 * ENV cc=${aa}
				 */
				it("${var}", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 6), "renamed"),
						TextEdit.replace(Range.create(2, 4, 2, 6), "renamed"),
						TextEdit.replace(Range.create(2, 14, 2, 16), "renamed"),
						TextEdit.replace(Range.create(3, 9, 3, 11), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(5, 4, 5, 6), "renamed"),
						TextEdit.replace(Range.create(6, 4, 6, 6), "renamed"),
						TextEdit.replace(Range.create(6, 14, 6, 16), "renamed"),
						TextEdit.replace(Range.create(7, 9, 7, 11), "renamed")
					];
					let document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}\n" + 
						"FROM alpine\nENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 5, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 2, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 2, 15, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 15, "renamed"), expectedEdits2);
					assertEdits(rename(document, 3, 10, "renamed"), expectedEdits);
					assertEdits(rename(document, 7, 10, "renamed"), expectedEdits2);
				});

				/**
				 * ENV aa=x
				 * ENV aa=y bb=$aa
				 * ENV cc=$aa
				 */
				it("$var", function() {
					let expectedEdits = [
						TextEdit.replace(Range.create(1, 4, 1, 6), "renamed"),
						TextEdit.replace(Range.create(2, 4, 2, 6), "renamed"),
						TextEdit.replace(Range.create(2, 13, 2, 15), "renamed"),
						TextEdit.replace(Range.create(3, 8, 3, 10), "renamed")
					];
					let expectedEdits2 = [
						TextEdit.replace(Range.create(5, 4, 5, 6), "renamed"),
						TextEdit.replace(Range.create(6, 4, 6, 6), "renamed"),
						TextEdit.replace(Range.create(6, 13, 6, 15), "renamed"),
						TextEdit.replace(Range.create(7, 8, 7, 10), "renamed")
					];
					let document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa\n" +
						"FROM alpine\nENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 5, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 2, 5, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 5, "renamed"), expectedEdits2);
					assertEdits(rename(document, 2, 14, "renamed"), expectedEdits);
					assertEdits(rename(document, 6, 14, "renamed"), expectedEdits2);
					assertEdits(rename(document, 3, 9, "renamed"), expectedEdits);
					assertEdits(rename(document, 7, 9, "renamed"), expectedEdits2);
				});
			});

			describe("multiple variables", function() {
				it("${var}", function() {
					let expectedEditsA = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(2, 11, 2, 14), "renamed")
					];
					let expectedEditsA2 = [
						TextEdit.replace(Range.create(1, 14, 1, 18), "renamed"),
						TextEdit.replace(Range.create(2, 18, 2, 22), "renamed")
					];
					let expectedEditsB = [
						TextEdit.replace(Range.create(4, 4, 4, 7), "renamed"),
						TextEdit.replace(Range.create(5, 11, 5, 14), "renamed")
					];
					let expectedEditsB2 = [
						TextEdit.replace(Range.create(4, 14, 4, 18), "renamed"),
						TextEdit.replace(Range.create(5, 18, 5, 22), "renamed")
					];
					let document = createDocument(
						"FROM alpine\nENV var=value var2=value2\nRUN echo ${var} ${var2}\n" +
						"FROM alpine\nENV var=value var2=value2\nRUN echo ${var} ${var2}"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEditsA);
					assertEdits(rename(document, 2, 12, "renamed"), expectedEditsA);
					assertEdits(rename(document, 1, 16, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 2, 20, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 4, 5, "renamed"), expectedEditsB);
					assertEdits(rename(document, 5, 12, "renamed"), expectedEditsB);
					assertEdits(rename(document, 4, 16, "renamed"), expectedEditsB2);
					assertEdits(rename(document, 5, 20, "renamed"), expectedEditsB2);

					expectedEditsA = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(4, 11, 4, 14), "renamed"),
					];
					expectedEditsA2 = [
						TextEdit.replace(Range.create(2, 0, 2, 4), "renamed"),
						TextEdit.replace(Range.create(4, 18, 4, 22), "renamed")
					];
					let expectedEditsA3 = [
						TextEdit.replace(Range.create(3, 0, 3, 4), "renamed"),
						TextEdit.replace(Range.create(4, 26, 4, 30), "renamed")
					];
					expectedEditsB = [
						TextEdit.replace(Range.create(6, 4, 6, 7), "renamed"),
						TextEdit.replace(Range.create(9, 11, 9, 14), "renamed"),
					];
					expectedEditsB2 = [
						TextEdit.replace(Range.create(7, 0, 7, 4), "renamed"),
						TextEdit.replace(Range.create(9, 18, 9, 22), "renamed")
					];
					let expectedEditsB3 = [
						TextEdit.replace(Range.create(8, 0, 8, 4), "renamed"),
						TextEdit.replace(Range.create(9, 26, 9, 30), "renamed")
					];
					document = createDocument(
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}\n" +
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEditsA);
					assertEdits(rename(document, 4, 12, "renamed"), expectedEditsA);
					assertEdits(rename(document, 2, 2, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 4, 20, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 3, 2, "renamed"), expectedEditsA3);
					assertEdits(rename(document, 4, 28, "renamed"), expectedEditsA3);
					assertEdits(rename(document, 6, 5, "renamed"), expectedEditsB);
					assertEdits(rename(document, 9, 12, "renamed"), expectedEditsB);
					assertEdits(rename(document, 7, 2, "renamed"), expectedEditsB2);
					assertEdits(rename(document, 9, 20, "renamed"), expectedEditsB2);
					assertEdits(rename(document, 8, 2, "renamed"), expectedEditsB3);
					assertEdits(rename(document, 9, 28, "renamed"), expectedEditsB3);
				});

				it("$var", function() {
					let expectedEditsA = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(2, 10, 2, 13), "renamed"),
					];
					let expectedEditsA2 = [
						TextEdit.replace(Range.create(1, 14, 1, 18), "renamed"),
						TextEdit.replace(Range.create(2, 15, 2, 19), "renamed")
					];
					let expectedEditsB = [
						TextEdit.replace(Range.create(4, 4, 4, 7), "renamed"),
						TextEdit.replace(Range.create(5, 10, 5, 13), "renamed"),
					];
					let expectedEditsB2 = [
						TextEdit.replace(Range.create(4, 14, 4, 18), "renamed"),
						TextEdit.replace(Range.create(5, 15, 5, 19), "renamed")
					];
					let document = createDocument(
						"FROM alpine\nENV var=value var2=value2\nRUN echo $var $var2\n" +
						"FROM alpine\nENV var=value var2=value2\nRUN echo $var $var2"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEditsA);
					assertEdits(rename(document, 2, 12, "renamed"), expectedEditsA);
					assertEdits(rename(document, 1, 16, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 2, 16, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 4, 5, "renamed"), expectedEditsB);
					assertEdits(rename(document, 5, 12, "renamed"), expectedEditsB);
					assertEdits(rename(document, 4, 16, "renamed"), expectedEditsB2);
					assertEdits(rename(document, 5, 16, "renamed"), expectedEditsB2);

					expectedEditsA = [
						TextEdit.replace(Range.create(1, 4, 1, 7), "renamed"),
						TextEdit.replace(Range.create(4, 10, 4, 13), "renamed"),
					];
					expectedEditsA2 = [
						TextEdit.replace(Range.create(2, 0, 2, 4), "renamed"),
						TextEdit.replace(Range.create(4, 15, 4, 19), "renamed")
					];
					let expectedEditsA3 = [
						TextEdit.replace(Range.create(3, 0, 3, 4), "renamed"),
						TextEdit.replace(Range.create(4, 21, 4, 25), "renamed")
					];
					expectedEditsB = [
						TextEdit.replace(Range.create(6, 4, 6, 7), "renamed"),
						TextEdit.replace(Range.create(9, 10, 9, 13), "renamed"),
					];
					expectedEditsB2 = [
						TextEdit.replace(Range.create(7, 0, 7, 4), "renamed"),
						TextEdit.replace(Range.create(9, 15, 9, 19), "renamed")
					];
					let expectedEditsB3 = [
						TextEdit.replace(Range.create(8, 0, 8, 4), "renamed"),
						TextEdit.replace(Range.create(9, 21, 9, 25), "renamed")
					];
					document = createDocument(
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3\n" +
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3"
					);
					assertEdits(rename(document, 1, 5, "renamed"), expectedEditsA);
					assertEdits(rename(document, 4, 12, "renamed"), expectedEditsA);
					assertEdits(rename(document, 2, 2, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 4, 16, "renamed"), expectedEditsA2);
					assertEdits(rename(document, 3, 2, "renamed"), expectedEditsA3);
					assertEdits(rename(document, 4, 22, "renamed"), expectedEditsA3);
					assertEdits(rename(document, 6, 5, "renamed"), expectedEditsB);
					assertEdits(rename(document, 9, 12, "renamed"), expectedEditsB);
					assertEdits(rename(document, 7, 2, "renamed"), expectedEditsB2);
					assertEdits(rename(document, 9, 16, "renamed"), expectedEditsB2);
					assertEdits(rename(document, 8, 2, "renamed"), expectedEditsB3);
					assertEdits(rename(document, 9, 22, "renamed"), expectedEditsB3);
				});
			});
		});
	});



	describe("before FROM", function() {
		describe("ARG", function() {
			it("FROM lookup", function() {
				let expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed")
				];
				let document = createDocument("ARG image=alpine\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);

				expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 11), "renamed")
				];
				document = createDocument("ARG image=alpine\nFROM $image\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), expectedEdits);

				expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 4, 1, 9), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 11), "renamed")
				];
				document = createDocument("ARG image=alpine\nARG image=alpine\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), expectedEdits);
			});

			it("reused variable name", function() {
				let expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
				];
				let document = createDocument("ARG image=alpine\nFROM $image\nARG image=alpine2");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 6, "renamed"), [ TextEdit.replace(Range.create(2, 4, 2, 9), "renamed") ]);

				expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(3, 6, 3, 11), "renamed")
				];
				document = createDocument("ARG image=alpine\nFROM $image\nARG image=alpine2\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 6, "renamed"), [ TextEdit.replace(Range.create(2, 4, 2, 9), "renamed") ]);
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);

				expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 11), "renamed")
				];
				document = createDocument("ARG image=alpine\nFROM $image\nFROM $image\nARG image=alpine2");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 3, 6, "renamed"), [ TextEdit.replace(Range.create(3, 4, 3, 9), "renamed") ]);
			});

			it("scoped", function() {
				let document = createDocument("ARG image=alpine\nFROM alpine\nRUN echo $image");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 2, 12, "renamed"), [ TextEdit.replace(Range.create(2, 10, 2, 15), "renamed") ]);

				let expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed")
				];
				document = createDocument("ARG image=alpine\nFROM $image\nRUN echo $image");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 12, "renamed"), [ TextEdit.replace(Range.create(2, 10, 2, 15), "renamed") ]);
			});

			it("non-existent variable", function() {
				let document = createDocument("FROM $image\nARG image");
				assertEdits(rename(document, 0, 8, "renamed"), [ TextEdit.replace(Range.create(0, 6, 0, 11), "renamed") ]);
				assertEdits(rename(document, 1, 7, "renamed"), [ TextEdit.replace(Range.create(1, 4, 1, 9), "renamed") ]);

				document = createDocument("ARG\nFROM $image");
				assertEdits(rename(document, 1, 8, "renamed"), [ TextEdit.replace(Range.create(1, 6, 1, 11), "renamed") ]);

				let expectedEdits = [
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 11), "renamed")
				];
				document = createDocument("ARG\nFROM $image\nFROM $image");
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), expectedEdits);

				document = createDocument("ARG image=alpine\nFROM $image2\nARG image2=alpine2");
				assertEdits(rename(document, 0, 8, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 10, "renamed"), [ TextEdit.replace(Range.create(1, 6, 1, 12), "renamed") ]);
				assertEdits(rename(document, 2, 8, "renamed"), [ TextEdit.replace(Range.create(2, 4, 2, 10), "renamed") ]);
			});
		});

		describe("ENV", function() {
			it("FROM lookup", function() {
				let document = createDocument("ENV image=alpine\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 8, "renamed"), [ TextEdit.replace(Range.create(1, 6, 1, 11), "renamed") ]);

				let expectedEdits = [
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 11), "renamed")
				];
				document = createDocument("ENV image=alpine\nFROM $image\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), expectedEdits);

				expectedEdits = [
					TextEdit.replace(Range.create(0, 4, 0, 9), "renamed"),
					TextEdit.replace(Range.create(1, 4, 1, 9), "renamed"),
				];
				document = createDocument("ENV image=alpine\nENV image=alpine\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 1, 6, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), [ TextEdit.replace(Range.create(2, 6, 2, 11), "renamed") ]);
			});

			it("reused variable name", function() {
				let document = createDocument("ENV image=alpine\nFROM $image\nENV image=alpine2");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 8, "renamed"), [ TextEdit.replace(Range.create(1, 6, 1, 11), "renamed") ]);
				assertEdits(rename(document, 2, 6, "renamed"), [ TextEdit.replace(Range.create(2, 4, 2, 9), "renamed") ]);

				let expectedEdits = [
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(3, 6, 3, 11), "renamed")
				];
				document = createDocument("ENV image=alpine\nFROM $image\nENV image=alpine2\nFROM $image");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 6, "renamed"), [ TextEdit.replace(Range.create(2, 4, 2, 9), "renamed") ]);
				assertEdits(rename(document, 3, 6, "renamed"), expectedEdits);

				expectedEdits = [
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 11), "renamed")
				];
				document = createDocument("ENV image=alpine\nFROM $image\nFROM $image\nENV image=alpine2");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 3, 6, "renamed"), [ TextEdit.replace(Range.create(3, 4, 3, 9), "renamed") ]);
			});

			it("scoped", function() {
				let document = createDocument("ENV image=alpine\nFROM alpine\nRUN echo $image");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 2, 12, "renamed"), [ TextEdit.replace(Range.create(2, 10, 2, 15), "renamed") ]);

				document = createDocument("ENV image=alpine\nFROM $image\nRUN echo $image");
				assertEdits(rename(document, 0, 6, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 8, "renamed"), [ TextEdit.replace(Range.create(1, 6, 1, 11), "renamed") ]);
				assertEdits(rename(document, 2, 12, "renamed"), [ TextEdit.replace(Range.create(2, 10, 2, 15), "renamed") ]);
			});

			it("non-existent variable", function() {
				let document = createDocument("FROM $image\nENV image");
				assertEdits(rename(document, 0, 8, "renamed"), [ TextEdit.replace(Range.create(0, 6, 0, 11), "renamed") ]);
				assertEdits(rename(document, 1, 7, "renamed"), [ TextEdit.replace(Range.create(1, 4, 1, 9), "renamed") ]);

				document = createDocument("ENV\nFROM $image");
				assertEdits(rename(document, 1, 8, "renamed"), [ TextEdit.replace(Range.create(1, 6, 1, 11), "renamed") ]);

				let expectedEdits = [
					TextEdit.replace(Range.create(1, 6, 1, 11), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 11), "renamed")
				];
				document = createDocument("ENV\nFROM $image\nFROM $image");
				assertEdits(rename(document, 1, 8, "renamed"), expectedEdits);
				assertEdits(rename(document, 2, 8, "renamed"), expectedEdits);

				document = createDocument("ENV image=alpine\nFROM $image2\nENV image2=alpine2");
				assertEdits(rename(document, 0, 8, "renamed"), [ TextEdit.replace(Range.create(0, 4, 0, 9), "renamed") ]);
				assertEdits(rename(document, 1, 10, "renamed"), [ TextEdit.replace(Range.create(1, 6, 1, 12), "renamed") ]);
				assertEdits(rename(document, 2, 8, "renamed"), [ TextEdit.replace(Range.create(2, 4, 2, 10), "renamed") ]);
			});
		});
	});

	describe("non-existent variable", function() {
		describe("no FROM", function() {
			it("${var}", function() {
				let expectedEdits = [
					TextEdit.replace(Range.create(0, 13, 0, 16), "renamed"),
					TextEdit.replace(Range.create(1, 7, 1, 10), "renamed"),
					TextEdit.replace(Range.create(2, 10, 2, 13), "renamed")
				];
				let document = createDocument("STOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
				let edits = rename(document, 0, 14, "renamed");
				assertEdits(edits, expectedEdits);
				edits = rename(document, 1, 7, "renamed");
				assertEdits(edits, expectedEdits);
				edits = rename(document, 2, 11, "renamed");
				assertEdits(edits, expectedEdits);
			});
	
			it("referenced variable $var no value", function() {
				let expectedEdits = [
					TextEdit.replace(Range.create(0, 12, 0, 15), "renamed"),
					TextEdit.replace(Range.create(1, 6, 1, 9), "renamed"),
					TextEdit.replace(Range.create(2, 9, 2, 12), "renamed")
				];
				let document = createDocument("STOPSIGNAL $var\nUSER $var\nWORKDIR $var");
				let edits = rename(document, 0, 14, "renamed");
				assertEdits(edits, expectedEdits);
				edits = rename(document, 1, 7, "renamed");
				assertEdits(edits, expectedEdits);
				edits = rename(document, 2, 11, "renamed");
				assertEdits(edits, expectedEdits);
			});
		});

		describe("build stage", function() {
			it("${var}", function() {
				let expectedEditsA = [
					TextEdit.replace(Range.create(1, 13, 1, 16), "renamed"),
					TextEdit.replace(Range.create(2, 7, 2, 10), "renamed"),
					TextEdit.replace(Range.create(3, 10, 3, 13), "renamed")
				];
				let expectedEditsB = [
					TextEdit.replace(Range.create(5, 13, 5, 16), "renamed"),
					TextEdit.replace(Range.create(6, 7, 6, 10), "renamed"),
					TextEdit.replace(Range.create(7, 10, 7, 13), "renamed")
				];
				let document = createDocument(
					"FROM busybox\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
					"FROM busybox\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
				);
				assertEdits(rename(document, 1, 14, "renamed"), expectedEditsA);
				assertEdits(rename(document, 2, 7, "renamed"), expectedEditsA);
				assertEdits(rename(document, 3, 11, "renamed"), expectedEditsA);
				assertEdits(rename(document, 5, 14, "renamed"), expectedEditsB);
				assertEdits(rename(document, 6, 7, "renamed"), expectedEditsB);
				assertEdits(rename(document, 7, 11, "renamed"), expectedEditsB);
			});
	
			it("referenced variable $var no value", function() {
				let expectedEditsA = [
					TextEdit.replace(Range.create(1, 12, 1, 15), "renamed"),
					TextEdit.replace(Range.create(2, 6, 2, 9), "renamed"),
					TextEdit.replace(Range.create(3, 9, 3, 12), "renamed")
				];
				let expectedEditsB = [
					TextEdit.replace(Range.create(5, 12, 5, 15), "renamed"),
					TextEdit.replace(Range.create(6, 6, 6, 9), "renamed"),
					TextEdit.replace(Range.create(7, 9, 7, 12), "renamed")
				];
				let document = createDocument(
					"FROM busybox\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\n" +
					"FROM busybox\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var"
				);
				assertEdits(rename(document, 1, 14, "renamed"), expectedEditsA);
				assertEdits(rename(document, 2, 7, "renamed"), expectedEditsA);
				assertEdits(rename(document, 3, 11, "renamed"), expectedEditsA);
				assertEdits(rename(document, 5, 14, "renamed"), expectedEditsB);
				assertEdits(rename(document, 6, 7, "renamed"), expectedEditsB);
				assertEdits(rename(document, 7, 11, "renamed"), expectedEditsB);
			});
		});
	});
});
