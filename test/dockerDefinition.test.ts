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
			});
		});
	}

	createVariablesTest("ARG", "ARG", "=");

	describe("ENV", function() {
		createVariablesTest("equals delimiter", "ENV", "=");
		createVariablesTest("space delimiter", "ENV", " ");

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
});
