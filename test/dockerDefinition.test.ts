/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, Position, Location } from 'vscode-languageserver';
import { DockerDefinition } from '../src/dockerDefinition';

let provider = new DockerDefinition();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function computeDefinition(document: TextDocument, position: Position): Location {
	return provider.computeDefinition(document, position);
}

function findDefinition(document: TextDocument, line: number, character: number): Location {
	return provider.computeDefinition(document, Position.create(line, character));
}

function assertLocation(location: Location, uri: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(location.uri, uri);
	assert.equal(location.range.start.line, startLine);
	assert.equal(location.range.start.character, startCharacter);
	assert.equal(location.range.end.line, endLine);
	assert.equal(location.range.end.character, endCharacter);
}

describe("Dockerfile Document Definition tests", function() {
	describe("FROM", function() {
		describe("AS name", function() {
			it("no COPY", function() {
				let document = createDocument("FROM node AS bootstrap");
				let location = computeDefinition(document, Position.create(0, 17));
				assertLocation(location, document.uri, 0, 13, 0, 22);
			});

			it("COPY", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor in the FROM
				let location = computeDefinition(document, Position.create(0, 17));
				assertLocation(location, document.uri, 0, 13, 0, 22);

				// cursor in the COPY
				location = computeDefinition(document, Position.create(2, 16));
				assertLocation(location, document.uri, 0, 13, 0, 22);
			});

			it("COPY incomplete", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap");
				// cursor in the FROM
				let location = computeDefinition(document, Position.create(0, 17));
				assertLocation(location, document.uri, 0, 13, 0, 22);

				// cursor in the COPY
				location = computeDefinition(document, Position.create(2, 16));
				assertLocation(location, document.uri, 0, 13, 0, 22);
			});

			it("source mismatch", function() {
				let document = createDocument("FROM node AS bootstrap\nFROM node\nCOPY --from=bootstrap2 /git/bin/app .");
				// cursor in the FROM
				let location = computeDefinition(document, Position.create(0, 17));
				assertLocation(location, document.uri, 0, 13, 0, 22);

				// cursor in the COPY
				location = computeDefinition(document, Position.create(2, 16));
				assert.equal(location, null);
			});
		});

		describe("invalid", function() {
			it("position", function() {
				let document = createDocument("FROM node AS bootstrap   \nFROM node\nCOPY --from=bootstrap /git/bin/app .");
				// cursor after the AS source image
				let location = computeDefinition(document, Position.create(0, 24));
				assert.equal(location, null);
				// cursor after the COPY --from
				location = computeDefinition(document, Position.create(2, 22));
				assert.equal(location, null);
			});

			it("COPY bootstrap", function() {
				let document = createDocument("FROM node AS bootstrap\nCOPY bootstrap /git/build/");
				// cursor after the AS source image
				let location = computeDefinition(document, Position.create(1, 10));
				assert.equal(location, null);
			});
		});
	});

	function createVariablesTest(testSuiteName: string, instruction: string, delimiter: string) {
		describe(testSuiteName, function() {
			describe("no FROM", function() {
				describe("${var}", function() {
					it("value", function() {
						let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
						let location = computeDefinition(document, Position.create(1, 13));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 7));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 11));
						assertLocation(location, document.uri, 0, 4, 0, 7);

						document = createDocument(instruction + " var_var" + delimiter + "value\nSTOPSIGNAL ${var_var}\nUSER ${var_var}\nWORKDIR ${var_var}");
						location = computeDefinition(document, Position.create(1, 13));
						assertLocation(location, document.uri, 0, 4, 0, 11);
						location = computeDefinition(document, Position.create(2, 7));
						assertLocation(location, document.uri, 0, 4, 0, 11);
						location = computeDefinition(document, Position.create(3, 11));
						assertLocation(location, document.uri, 0, 4, 0, 11);
					});

					it("no value", function() {
						let document = createDocument(instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
						let location = computeDefinition(document, Position.create(1, 13));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 7));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 11));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("nested no value", function() {
						let document = createDocument(instruction + " var\nSTOPSIGNAL prefix${var}\nUSER prefix${var}\nWORKDIR prefix${var}");
						let location = computeDefinition(document, Position.create(1, 19));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 17));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("nested escaped", function() {
						let document = createDocument(instruction + " var\nSTOPSIGNAL prefix\\${var}\nUSER prefix\\${var}\nWORKDIR prefix\\${var}");
						let location = computeDefinition(document, Position.create(1, 20));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(2, 14));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 18));
						assert.equal(location, null);
					});

					it("no definition", function() {
						let document = createDocument(instruction + "\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}");
						let location = computeDefinition(document, Position.create(1, 13));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(2, 7));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 11));
						assert.equal(location, null);
					});

					it("repeated declaration", function() {
						let document = createDocument(instruction + " var=value\n" + instruction + " var=value\nRUN echo ${var}\nRUN echo${var}");
						let location = computeDefinition(document, Position.create(0, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("repeated declaration no value", function() {
						let document = createDocument(instruction + " var\n" + instruction + " var\nRUN echo ${var}\nRUN echo${var}");
						let location = computeDefinition(document, Position.create(0, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("redeclared variable after reference", function() {
						let document = createDocument(instruction + " var\nRUN echo ${var}\n" + instruction + " var");
						let location = computeDefinition(document, Position.create(0, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(1, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});
				});

				describe("$var", function() {
					it("value", function() {
						let document = createDocument(instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
						let location = computeDefinition(document, Position.create(1, 13));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 7));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 11));
						assertLocation(location, document.uri, 0, 4, 0, 7);

						document = createDocument(instruction + " var" + delimiter + "value\nRUN echo \"$var\"");
						location = computeDefinition(document, Position.create(1, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);

						document = createDocument(instruction + " var_var" + delimiter + "value\nSTOPSIGNAL $var_var\nUSER $var_var\nWORKDIR $var_var");
						location = computeDefinition(document, Position.create(1, 13));
						assertLocation(location, document.uri, 0, 4, 0, 11);
						location = computeDefinition(document, Position.create(2, 7));
						assertLocation(location, document.uri, 0, 4, 0, 11);
						location = computeDefinition(document, Position.create(3, 11));
						assertLocation(location, document.uri, 0, 4, 0, 11);

						document = createDocument(instruction + " var" + delimiter + "value\nRUN echo '$var'");
						location = computeDefinition(document, Position.create(1, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("no value", function() {
						let document = createDocument(instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
						let location = computeDefinition(document, Position.create(1, 13));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 7));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 11));
						assertLocation(location, document.uri, 0, 4, 0, 7);

						document = createDocument(instruction + " var\nRUN echo \"$var\"");
						location = computeDefinition(document, Position.create(1, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);

						document = createDocument(instruction + " var\nRUN echo '$var'");
						location = computeDefinition(document, Position.create(1, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("nested no value", function() {
						let document = createDocument(instruction + " var\nSTOPSIGNAL prefix$var\nUSER prefix$var\nWORKDIR prefix$var");
						let location = computeDefinition(document, Position.create(1, 19));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 17));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("nested escaped", function() {
						let document = createDocument(instruction + " var\nSTOPSIGNAL prefix\\$var\nUSER prefix\\$var\nWORKDIR prefix\\$var");
						let location = computeDefinition(document, Position.create(1, 20));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(2, 14));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 18));
						assert.equal(location, null);
					});

					it("no definition", function() {
						let document = createDocument(instruction + "\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var");
						let location = computeDefinition(document, Position.create(1, 13));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(2, 7));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 11));
						assert.equal(location, null);

						document = createDocument(instruction + "\nRUN echo \"$var\"");
						location = computeDefinition(document, Position.create(1, 12));
						assert.equal(location, null);

						document = createDocument(instruction + "\nRUN echo '$var'");
						location = computeDefinition(document, Position.create(1, 12));
						assert.equal(location, null);
					});

					it("repeated declaration", function() {
						let document = createDocument(instruction + " var=value\n" + instruction + " var=value\nRUN echo $var\nRUN echo $var");
						let location = computeDefinition(document, Position.create(0, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("repeated declaration no value", function() {
						let document = createDocument(instruction + " var\n" + instruction + " var\nRUN echo ${var}\nRUN echo${var}");
						let location = computeDefinition(document, Position.create(0, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});

					it("redeclared variable after reference", function() {
						let document = createDocument(instruction + " var\nRUN echo $var\n" + instruction + " var");
						let location = computeDefinition(document, Position.create(0, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(1, 11));
						assertLocation(location, document.uri, 0, 4, 0, 7);
						location = computeDefinition(document, Position.create(2, 5));
						assertLocation(location, document.uri, 0, 4, 0, 7);
					});
				});
			});

			describe("build stage", function() {
				describe("${var}", function() {
					it("value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
						);
						let location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 7));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 11));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(7, 13));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 7));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 11));
						assertLocation(location, document.uri, 6, 4, 6, 7);

						document = createDocument(
							"FROM alpine\n" + instruction + " var_var" + delimiter + "value\nSTOPSIGNAL ${var_var}\nUSER ${var_var}\nWORKDIR ${var_var}\n" +
							"FROM alpine\n" + instruction + " var_var" + delimiter + "value\nSTOPSIGNAL ${var_var}\nUSER ${var_var}\nWORKDIR ${var_var}"
						);
						location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 1, 4, 1, 11);
						location = computeDefinition(document, Position.create(3, 7));
						assertLocation(location, document.uri, 1, 4, 1, 11);
						location = computeDefinition(document, Position.create(4, 11));
						assertLocation(location, document.uri, 1, 4, 1, 11);
						location = computeDefinition(document, Position.create(7, 13));
						assertLocation(location, document.uri, 6, 4, 6, 11);
						location = computeDefinition(document, Position.create(8, 7));
						assertLocation(location, document.uri, 6, 4, 6, 11);
						location = computeDefinition(document, Position.create(9, 11));
						assertLocation(location, document.uri, 6, 4, 6, 11);
					});

					it("no value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
						);
						let location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 7));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 11));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(7, 13));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 7));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 11));
						assertLocation(location, document.uri, 6, 4, 6, 7);
					});

					it("nested no value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix${var}\nUSER prefix${var}\nWORKDIR prefix${var}\n" +
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix${var}\nUSER prefix${var}\nWORKDIR prefix${var}"
						);
						let location = computeDefinition(document, Position.create(2, 19));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 13));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 17));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(7, 19));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 13));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 17));
						assertLocation(location, document.uri, 6, 4, 6, 7);
					});

					it("nested escaped", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix\\${var}\nUSER prefix\\${var}\nWORKDIR prefix\\${var}\n" +
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix\\${var}\nUSER prefix\\${var}\nWORKDIR prefix\\${var}"
						);
						let location = computeDefinition(document, Position.create(2, 20));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 14));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(4, 18));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(7, 20));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(8, 14));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(9, 18));
						assert.equal(location, null);
					});

					it("no definition", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + "\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}\n" +
							"FROM alpine\n" + instruction + "\nSTOPSIGNAL ${var}\nUSER ${var}\nWORKDIR ${var}"
						);
						let location = computeDefinition(document, Position.create(2, 13));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 7));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(4, 11));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(7, 13));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(8, 7));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(9, 11));
						assert.equal(location, null);
					});

					it("repeated declaration", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var=value\n" + instruction + " var=value\nRUN echo ${var}\nRUN echo${var}\n" +
							"FROM alpine\n" + instruction + " var=value\n" + instruction + " var=value\nRUN echo ${var}\nRUN echo${var}"
						);
						let location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(2, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(6, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(7, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
					});

					it("repeated declaration no value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\n" + instruction + " var\nRUN echo ${var}\nRUN echo${var}\n" +
							"FROM alpine\n" + instruction + " var\n" + instruction + " var\nRUN echo ${var}\nRUN echo${var}"
						);
						let location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(2, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(6, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(7, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
					});

					it("redeclared variable after reference", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nRUN echo ${var}\n" + instruction + " var\n" +
							"FROM alpine\n" + instruction + " var\nRUN echo ${var}\n" + instruction + " var"
						);
						let location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(5, 5));
						assertLocation(location, document.uri, 5, 4, 5, 7);
						location = computeDefinition(document, Position.create(6, 12));
						assertLocation(location, document.uri, 5, 4, 5, 7);
						location = computeDefinition(document, Position.create(7, 5));
						assertLocation(location, document.uri, 5, 4, 5, 7);
					});
				});

				describe("$var", function() {
					it("value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\n" +
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var"
						);
						let location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 7));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 11));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(7, 13));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 7));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 11));
						assertLocation(location, document.uri, 6, 4, 6, 7);

						document = createDocument(
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo \"$var\"\n" +
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo \"$var\""
						);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(5, 12));
						assertLocation(location, document.uri, 4, 4, 4, 7);

						document = createDocument(
							"FROM alpine\n" + instruction + " var_var" + delimiter + "value\nSTOPSIGNAL $var_var\nUSER $var_var\nWORKDIR $var_var\n" +
							"FROM alpine\n" + instruction + " var_var" + delimiter + "value\nSTOPSIGNAL $var_var\nUSER $var_var\nWORKDIR $var_var"
						);
						location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 1, 4, 1, 11);
						location = computeDefinition(document, Position.create(3, 7));
						assertLocation(location, document.uri, 1, 4, 1, 11);
						location = computeDefinition(document, Position.create(4, 11));
						assertLocation(location, document.uri, 1, 4, 1, 11);
						location = computeDefinition(document, Position.create(7, 13));
						assertLocation(location, document.uri, 6, 4, 6, 11);
						location = computeDefinition(document, Position.create(8, 7));
						assertLocation(location, document.uri, 6, 4, 6, 11);
						location = computeDefinition(document, Position.create(9, 11));
						assertLocation(location, document.uri, 6, 4, 6, 11);

						document = createDocument(
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo '$var'\n" +
							"FROM alpine\n" + instruction + " var" + delimiter + "value\nRUN echo '$var'"
						);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(5, 12));
						assertLocation(location, document.uri, 4, 4, 4, 7);
					});

					it("no value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\n" +
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var"
						);
						let location = computeDefinition(document, Position.create(2, 13));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 7));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 11));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(7, 13));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 7));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 11));
						assertLocation(location, document.uri, 6, 4, 6, 7);

						document = createDocument(
							"FROM alpine\n" + instruction + " var\nRUN echo \"$var\"\n" +
							"FROM alpine\n" + instruction + " var\nRUN echo \"$var\""
						);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(5, 12));
						assertLocation(location, document.uri, 4, 4, 4, 7);

						document = createDocument(
							"FROM alpine\n" + instruction + " var\nRUN echo '$var'\n" +
							"FROM alpine\n" + instruction + " var\nRUN echo '$var'"
						);
						location = computeDefinition(document, Position.create(2, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(5, 12));
						assertLocation(location, document.uri, 4, 4, 4, 7);
					});

					it("nested no value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix$var\nUSER prefix$var\nWORKDIR prefix$var\n" +
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix$var\nUSER prefix$var\nWORKDIR prefix$var"
						);
						let location = computeDefinition(document, Position.create(2, 19));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 13));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 17));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(7, 19));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 13));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 17));
						assertLocation(location, document.uri, 6, 4, 6, 7);
					});

					it("nested escaped", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix\\$var\nUSER prefix\\$var\nWORKDIR prefix\\$var\n" +
							"FROM alpine\n" + instruction + " var\nSTOPSIGNAL prefix\\$var\nUSER prefix\\$var\nWORKDIR prefix\\$var"
						);
						let location = computeDefinition(document, Position.create(2, 20));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 14));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(4, 18));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(7, 20));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(8, 14));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(9, 18));
						assert.equal(location, null);
					});

					it("no definition", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + "\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var\n" +
							"FROM alpine\n" + instruction + "\nSTOPSIGNAL $var\nUSER $var\nWORKDIR $var"
						);
						let location = computeDefinition(document, Position.create(2, 13));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(3, 7));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(4, 11));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(7, 13));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(8, 7));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(9, 11));
						assert.equal(location, null);

						document = createDocument(
							"FROM alpine\n" + instruction + "\nRUN echo \"$var\"\n" +
							"FROM alpine\n" + instruction + "\nRUN echo \"$var\""
						);
						location = computeDefinition(document, Position.create(2, 12));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(5, 12));
						assert.equal(location, null);

						document = createDocument(
							"FROM alpine\n" + instruction + "\nRUN echo '$var'\n" +
							"FROM alpine\n" + instruction + "\nRUN echo '$var'"
						);
						location = computeDefinition(document, Position.create(2, 12));
						assert.equal(location, null);
						location = computeDefinition(document, Position.create(5, 12));
						assert.equal(location, null);
					});

					it("repeated declaration", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var=value\n" + instruction + " var=value\nRUN echo $var\nRUN echo $var\n" +
							"FROM alpine\n" + instruction + " var=value\n" + instruction + " var=value\nRUN echo $var\nRUN echo $var"
						);
						let location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(2, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(6, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(7, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
					});

					it("repeated declaration no value", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\n" + instruction + " var\nRUN echo ${var}\nRUN echo${var}\n" +
							"FROM alpine\n" + instruction + " var\n" + instruction + " var\nRUN echo ${var}\nRUN echo${var}"
						);
						let location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(2, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(4, 12));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(6, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(7, 5));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(8, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
						location = computeDefinition(document, Position.create(9, 12));
						assertLocation(location, document.uri, 6, 4, 6, 7);
					});

					it("redeclared variable after reference", function() {
						let document = createDocument(
							"FROM alpine\n" + instruction + " var\nRUN echo $var\n" + instruction + " var\n" +
							"FROM alpine\n" + instruction + " var\nRUN echo $var\n" + instruction + " var"
						);
						let location = computeDefinition(document, Position.create(1, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(2, 11));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(3, 5));
						assertLocation(location, document.uri, 1, 4, 1, 7);
						location = computeDefinition(document, Position.create(5, 5));
						assertLocation(location, document.uri, 5, 4, 5, 7);
						location = computeDefinition(document, Position.create(6, 11));
						assertLocation(location, document.uri, 5, 4, 5, 7);
						location = computeDefinition(document, Position.create(7, 5));
						assertLocation(location, document.uri, 5, 4, 5, 7);
					});
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
					let location = computeDefinition(document, Position.create(0, 5));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(1, 12));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(0, 11));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(1, 18));
					assert.equal(location, null);
				});

				it("$var", function() {
					let document = createDocument("ENV aa bb cc dd\nRUN echo $aa $cc");
					let location = computeDefinition(document, Position.create(0, 5));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(1, 11));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(0, 11));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(1, 15));
					assert.equal(location, null);
				});
			});

			describe("multiple variables", function() {
				it("${var}", function() {
					let document = createDocument("ENV var=value var2=value2\nRUN echo ${var} ${var2}");
					let location = computeDefinition(document, Position.create(0, 6));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(1, 12));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(0, 16));
					assertLocation(location, document.uri, 0, 14, 0, 18);
					location = computeDefinition(document, Position.create(1, 20));
					assertLocation(location, document.uri, 0, 14, 0, 18);

					document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}");
					location = computeDefinition(document, Position.create(0, 6));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(3, 12));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(1, 2));
					assertLocation(location, document.uri, 1, 0, 1, 4);
					location = computeDefinition(document, Position.create(3, 20));
					assertLocation(location, document.uri, 1, 0, 1, 4);
					location = computeDefinition(document, Position.create(2, 2));
					assertLocation(location, document.uri, 2, 0, 2, 4);
					location = computeDefinition(document, Position.create(3, 28));
					assertLocation(location, document.uri, 2, 0, 2, 4,);
				});

				it("$var", function() {
					let document = createDocument("ENV var=value var2=value2\nRUN echo $var $var2");
					let location = computeDefinition(document, Position.create(0, 6));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(1, 11));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(0, 16));
					assertLocation(location, document.uri, 0, 14, 0, 18);
					location = computeDefinition(document, Position.create(1, 17));
					assertLocation(location, document.uri, 0, 14, 0, 18);

					document = createDocument("ENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3");
					location = computeDefinition(document, Position.create(0, 6));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(3, 11));
					assertLocation(location, document.uri, 0, 4, 0, 7);
					location = computeDefinition(document, Position.create(1, 2));
					assertLocation(location, document.uri, 1, 0, 1, 4);
					location = computeDefinition(document, Position.create(3, 16));
					assertLocation(location, document.uri, 1, 0, 1, 4);
					location = computeDefinition(document, Position.create(2, 2));
					assertLocation(location, document.uri, 2, 0, 2, 4);
					location = computeDefinition(document, Position.create(3, 22));
					assertLocation(location, document.uri, 2, 0, 2, 4);
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
					let location = computeDefinition(document, Position.create(0, 5));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(1, 5));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(1, 15));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(2, 10));
					assertLocation(location, document.uri, 0, 4, 0, 6);
				});

				/**
				 * ENV aa=x
				 * ENV aa=y bb=$aa
				 * ENV cc=$aa
				 */
				it("$var", function() {
					let document = createDocument("ENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa");
					let location = computeDefinition(document, Position.create(0, 5));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(1, 5));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(1, 14));
					assertLocation(location, document.uri, 0, 4, 0, 6);
					location = computeDefinition(document, Position.create(2, 9));
					assertLocation(location, document.uri, 0, 4, 0, 6);
				});
			});
		});

		describe("build stage", function() {
			describe("single variable delimited by space", function() {
				it("${var}", function() {
					let document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo ${aa} ${cc}\n" +
						"FROM alpine\nENV aa bb cc dd\nRUN echo ${aa} ${cc}"
					);
					let location = computeDefinition(document, Position.create(1, 5));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(2, 12));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(1, 11));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(2, 18));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(4, 5));
					assertLocation(location, document.uri, 4, 4, 4, 6);
					location = computeDefinition(document, Position.create(5, 12));
					assertLocation(location, document.uri, 4, 4, 4, 6);
					location = computeDefinition(document, Position.create(4, 11));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(5, 18));
					assert.equal(location, null);
				});

				it("$var", function() {
					let document = createDocument(
						"FROM alpine\nENV aa bb cc dd\nRUN echo $aa $cc\n" +
						"FROM alpine\nENV aa bb cc dd\nRUN echo $aa $cc"
					);
					let location = computeDefinition(document, Position.create(1, 5));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(2, 11));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(1, 11));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(2, 15));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(4, 5));
					assertLocation(location, document.uri, 4, 4, 4, 6);
					location = computeDefinition(document, Position.create(5, 11));
					assertLocation(location, document.uri, 4, 4, 4, 6);
					location = computeDefinition(document, Position.create(4, 11));
					assert.equal(location, null);
					location = computeDefinition(document, Position.create(5, 15));
					assert.equal(location, null);
				});
			});

			describe("multiple variables", function() {
				it("${var}", function() {
					let document = createDocument(
						"FROM alpine\nENV var=value var2=value2\nRUN echo ${var} ${var2}\n" +
						"FROM alpine\nENV var=value var2=value2\nRUN echo ${var} ${var2}"
					);
					let location = computeDefinition(document, Position.create(1, 6));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(2, 12));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(1, 16));
					assertLocation(location, document.uri, 1, 14, 1, 18);
					location = computeDefinition(document, Position.create(2, 20));
					assertLocation(location, document.uri, 1, 14, 1, 18);
					location = computeDefinition(document, Position.create(4, 6));
					assertLocation(location, document.uri, 4, 4, 4, 7);
					location = computeDefinition(document, Position.create(5, 12));
					assertLocation(location, document.uri, 4, 4, 4, 7);
					location = computeDefinition(document, Position.create(4, 16));
					assertLocation(location, document.uri, 4, 14, 4, 18);
					location = computeDefinition(document, Position.create(5, 20));
					assertLocation(location, document.uri, 4, 14, 4, 18);

					document = createDocument(
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}\n" +
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo ${var} ${var2} ${var3}"
					);
					location = computeDefinition(document, Position.create(1, 6));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(4, 12));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(2, 2));
					assertLocation(location, document.uri, 2, 0, 2, 4);
					location = computeDefinition(document, Position.create(4, 20));
					assertLocation(location, document.uri, 2, 0, 2, 4);
					location = computeDefinition(document, Position.create(3, 2));
					assertLocation(location, document.uri, 3, 0, 3, 4);
					location = computeDefinition(document, Position.create(4, 28));
					assertLocation(location, document.uri, 3, 0, 3, 4,);
					location = computeDefinition(document, Position.create(6, 6));
					assertLocation(location, document.uri, 6, 4, 6, 7);
					location = computeDefinition(document, Position.create(9, 12));
					assertLocation(location, document.uri, 6, 4, 6, 7);
					location = computeDefinition(document, Position.create(7, 2));
					assertLocation(location, document.uri, 7, 0, 7, 4);
					location = computeDefinition(document, Position.create(9, 20));
					assertLocation(location, document.uri, 7, 0, 7, 4);
					location = computeDefinition(document, Position.create(8, 2));
					assertLocation(location, document.uri, 8, 0, 8, 4);
					location = computeDefinition(document, Position.create(9, 28));
					assertLocation(location, document.uri, 8, 0, 8, 4,);
				});

				it("$var", function() {
					let document = createDocument(
						"FROM alpine\nENV var=value var2=value2\nRUN echo $var $var2\n" +
						"FROM alpine\nENV var=value var2=value2\nRUN echo $var $var2"
					);
					let location = computeDefinition(document, Position.create(1, 6));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(2, 11));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(1, 16));
					assertLocation(location, document.uri, 1, 14, 1, 18);
					location = computeDefinition(document, Position.create(2, 17));
					assertLocation(location, document.uri, 1, 14, 1, 18);
					location = computeDefinition(document, Position.create(4, 6));
					assertLocation(location, document.uri, 4, 4, 4, 7);
					location = computeDefinition(document, Position.create(5, 11));
					assertLocation(location, document.uri, 4, 4, 4, 7);
					location = computeDefinition(document, Position.create(4, 16));
					assertLocation(location, document.uri, 4, 14, 4, 18);
					location = computeDefinition(document, Position.create(5, 17));
					assertLocation(location, document.uri, 4, 14, 4, 18);

					document = createDocument(
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3\n" +
						"FROM alpine\nENV var=value \\\nvar2=value2 \\\nvar3=value3\nRUN echo $var $var2 $var3"
					);
					location = computeDefinition(document, Position.create(1, 6));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(4, 11));
					assertLocation(location, document.uri, 1, 4, 1, 7);
					location = computeDefinition(document, Position.create(2, 2));
					assertLocation(location, document.uri, 2, 0, 2, 4);
					location = computeDefinition(document, Position.create(4, 16));
					assertLocation(location, document.uri, 2, 0, 2, 4);
					location = computeDefinition(document, Position.create(3, 2));
					assertLocation(location, document.uri, 3, 0, 3, 4);
					location = computeDefinition(document, Position.create(4, 22));
					assertLocation(location, document.uri, 3, 0, 3, 4);
					location = computeDefinition(document, Position.create(6, 6));
					assertLocation(location, document.uri, 6, 4, 6, 7);
					location = computeDefinition(document, Position.create(9, 11));
					assertLocation(location, document.uri, 6, 4, 6, 7);
					location = computeDefinition(document, Position.create(7, 2));
					assertLocation(location, document.uri, 7, 0, 7, 4);
					location = computeDefinition(document, Position.create(9, 16));
					assertLocation(location, document.uri, 7, 0, 7, 4);
					location = computeDefinition(document, Position.create(8, 2));
					assertLocation(location, document.uri, 8, 0, 8, 4);
					location = computeDefinition(document, Position.create(9, 22));
					assertLocation(location, document.uri, 8, 0, 8, 4);
				});
			});

			describe("reuse variable name", function() {

				/**
				 * ENV aa=x
				 * ENV aa=y bb=${aa}
				 * ENV cc=${aa}
				 */
				it("${var}", function() {
					let document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}\n" +
						"FROM alpine\nENV aa=x\nENV aa=y bb=${aa}\nENV cc=${aa}"
					);
					let location = computeDefinition(document, Position.create(1, 5));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(2, 5));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(2, 15));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(3, 10));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(5, 5));
					assertLocation(location, document.uri, 5, 4, 5, 6);
					location = computeDefinition(document, Position.create(6, 5));
					assertLocation(location, document.uri, 5, 4, 5, 6);
					location = computeDefinition(document, Position.create(6, 15));
					assertLocation(location, document.uri, 5, 4, 5, 6);
					location = computeDefinition(document, Position.create(7, 10));
					assertLocation(location, document.uri, 5, 4, 5, 6);
				});

				/**
				 * ENV aa=x
				 * ENV aa=y bb=$aa
				 * ENV cc=$aa
				 */
				it("$var", function() {
					let document = createDocument(
						"FROM alpine\nENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa\n" +
						"FROM alpine\nENV aa=x\nENV aa=y bb=$aa\nENV cc=$aa"
					);
					let location = computeDefinition(document, Position.create(1, 5));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(2, 5));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(2, 14));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(3, 9));
					assertLocation(location, document.uri, 1, 4, 1, 6);
					location = computeDefinition(document, Position.create(5, 5));
					assertLocation(location, document.uri, 5, 4, 5, 6);
					location = computeDefinition(document, Position.create(6, 5));
					assertLocation(location, document.uri, 5, 4, 5, 6);
					location = computeDefinition(document, Position.create(6, 14));
					assertLocation(location, document.uri, 5, 4, 5, 6);
					location = computeDefinition(document, Position.create(7, 9));
					assertLocation(location, document.uri, 5, 4, 5, 6);
				});
			});
		});
	});

	describe("ARG and ENV", function() {
		describe("no FROM", function() {
			it("repeated declaration ARG first", function() {
				let document = createDocument("ARG var\nENV var\nRUN echo $var");
				let location = computeDefinition(document, Position.create(0, 5));
				assertLocation(location, document.uri, 0, 4, 0, 7);
				location = computeDefinition(document, Position.create(1, 5));
				assertLocation(location, document.uri, 0, 4, 0, 7);
				location = computeDefinition(document, Position.create(2, 11));
				assertLocation(location, document.uri, 0, 4, 0, 7);
			});

			it("repeated declaration ENV first", function() {
				let document = createDocument("ENV var\nARG var\nRUN echo $var");
				let location = computeDefinition(document, Position.create(0, 5));
				assertLocation(location, document.uri, 0, 4, 0, 7);
				location = computeDefinition(document, Position.create(1, 5));
				assertLocation(location, document.uri, 0, 4, 0, 7);
				location = computeDefinition(document, Position.create(2, 11));
				assertLocation(location, document.uri, 0, 4, 0, 7);
			});
		});

		describe("build stage", function() {
			it("repeated declaration ARG first", function() {
				let document = createDocument(
					"FROM alpine\nARG var\nENV var\nRUN echo $var\n" +
					"FROM alpine\nARG var\nENV var\nRUN echo $var"
				);
				let location = computeDefinition(document, Position.create(1, 5));
				assertLocation(location, document.uri, 1, 4, 1, 7);
				location = computeDefinition(document, Position.create(2, 5));
				assertLocation(location, document.uri, 1, 4, 1, 7);
				location = computeDefinition(document, Position.create(3, 11));
				assertLocation(location, document.uri, 1, 4, 1, 7);
				location = computeDefinition(document, Position.create(5, 5));
				assertLocation(location, document.uri, 5, 4, 5, 7);
				location = computeDefinition(document, Position.create(6, 5));
				assertLocation(location, document.uri, 5, 4, 5, 7);
				location = computeDefinition(document, Position.create(7, 11));
				assertLocation(location, document.uri, 5, 4, 5, 7);
			});

			it("repeated declaration ENV first", function() {
				let document = createDocument(
					"FROM alpine\nENV var\nARG var\nRUN echo $var\n" +
					"FROM alpine\nENV var\nARG var\nRUN echo $var"
				);
				let location = computeDefinition(document, Position.create(1, 5));
				assertLocation(location, document.uri, 1, 4, 1, 7);
				location = computeDefinition(document, Position.create(2, 5));
				assertLocation(location, document.uri, 1, 4, 1, 7);
				location = computeDefinition(document, Position.create(3, 11));
				assertLocation(location, document.uri, 1, 4, 1, 7);
				location = computeDefinition(document, Position.create(5, 5));
				assertLocation(location, document.uri, 5, 4, 5, 7);
				location = computeDefinition(document, Position.create(6, 5));
				assertLocation(location, document.uri, 5, 4, 5, 7);
				location = computeDefinition(document, Position.create(7, 11));
				assertLocation(location, document.uri, 5, 4, 5, 7);
			});
		});
	});

	describe("before FROM", function() {
		describe("ARG", function() {
			it("FROM lookup", function() {
				let document = createDocument("ARG image=alpine\nFROM $image");
				let location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);

				document = createDocument("ARG image=alpine\nFROM $image\nFROM $image");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 2, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);
			});

			it("reused variable name", function() {
				let document = createDocument("ARG image=alpine\nFROM $image\nARG image=alpine2");
				let location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 2, 6);
				assertLocation(location, document.uri, 2, 4, 2, 9);

				document = createDocument("ARG image=alpine\nFROM $image\nARG image=alpine2\nFROM $image");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 2, 6);
				assertLocation(location, document.uri, 2, 4, 2, 9);
				location = findDefinition(document, 3, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);

				document = createDocument("ARG image=alpine\nFROM $image\nFROM $image\nARG image=alpine2");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 2, 8);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 3, 6);
				assertLocation(location, document.uri, 3, 4, 3, 9);
			});

			it("scoped", function() {
				let document = createDocument("ARG image=alpine\nFROM alpine\nRUN echo $image");
				let location = findDefinition(document, 2, 12);
				assert.equal(location, null);
			});

			it("non-existent variable", function() {
				let document = createDocument("FROM $image\nARG image");
				let location = findDefinition(document, 0, 8);
				assert.equal(location, null);

				document = createDocument("ARG\nFROM $image");
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);

				document = createDocument("ARG image=alpine\nFROM $image2\nARG image2=alpine2");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);
				location = findDefinition(document, 2, 6);
				assertLocation(location, document.uri, 2, 4, 2, 10);
			});
		});

		describe("ENV", function() {
			it("FROM lookup", function() {
				let document = createDocument("ENV image=alpine\nFROM $image");
				let location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);

				document = createDocument("ENV image=alpine\nFROM $image\nFROM $image");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);
				location = findDefinition(document, 2, 8);
				assert.equal(location, null);
			});

			it("reused variable name", function() {
				let document = createDocument("ENV image=alpine\nFROM $image\nENV image=alpine2");
				let location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);
				location = findDefinition(document, 2, 6);
				assertLocation(location, document.uri, 2, 4, 2, 9);

				document = createDocument("ENV image=alpine\nFROM $image\nENV image=alpine2\nFROM $image");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);
				location = findDefinition(document, 2, 6);
				assertLocation(location, document.uri, 2, 4, 2, 9);
				location = findDefinition(document, 3, 8);
				assert.equal(location, null);

				document = createDocument("ENV image=alpine\nFROM $image\nFROM $image\nENV image=alpine2");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);
				location = findDefinition(document, 2, 8);
				assert.equal(location, null);
				location = findDefinition(document, 3, 6);
				assertLocation(location, document.uri, 3, 4, 3, 9);
			});

			it("scoped", function() {
				let document = createDocument("ENV image=alpine\nFROM alpine\nRUN echo $image");
				let location = findDefinition(document, 2, 12);
				assert.equal(location, null);
			});

			it("non-existent variable", function() {
				let document = createDocument("FROM $image\nENV image");
				let location = findDefinition(document, 0, 8);
				assert.equal(location, null);

				document = createDocument("ENV\nFROM $image");
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);

				document = createDocument("ENV image=alpine\nFROM $image2\nENV image2=alpine2");
				location = findDefinition(document, 0, 6);
				assertLocation(location, document.uri, 0, 4, 0, 9);
				location = findDefinition(document, 1, 8);
				assert.equal(location, null);
				location = findDefinition(document, 2, 6);
				assertLocation(location, document.uri, 2, 4, 2, 10);
			});
		});
	});
});
