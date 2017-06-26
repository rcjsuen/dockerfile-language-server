/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import {
	TextDocument, Position, Range, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { Validator, ValidationCode } from '../src/dockerValidator';
import { KEYWORDS } from '../src/docker';

let source = "dockerfile-lsp";
let uri = "uri://host/Dockerfile.sample";
let validator = new Validator();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function validate(content: string) {
	return validator.validate(KEYWORDS, createDocument(content));
}

function assertInvalidPort(diagnostic: Diagnostic, port: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_PORT);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidPort(port));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInvalidStopSignal(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_STOPSIGNAL);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidStopsignal());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionCasing(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.LOWERCASE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Warning);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionCasing());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionExtraArgument(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.EXTRA_ARGUMENT);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionExtraArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionMissingArgument(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.MISSING_ARGUMENT);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionMissingArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertDirectiveUnknown(diagnostic: Diagnostic, directive: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.UNKNOWN_DIRECTIVE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_DirectiveUnknown(directive));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertDirectiveEscapeInvalid(diagnostic: Diagnostic, value: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_ESCAPE_DIRECTIVE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_DirectiveEscapeInvalid(value));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function testValidArgument(instruction: string, argument: string) {
	let gaps = [ " ", "\t", " \\\n", " \\\r", " \\\r\n" ];
	for (let gap of gaps) {
		let diagnostics = validate("FROM node\n" + instruction + gap + argument);
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " ");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r\n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " \n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " \r");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " \r\n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\n ");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r ");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r\n ");
		assert.equal(diagnostics.length, 0);
	}
}

function testEscape(instruction, argumentFront, argumentBack) {
	var argument = argumentFront + argumentBack;
	let diagnostics = validate("FROM node\n" + instruction + " \\\n" + argument);
	assert.equal(diagnostics.length, 0);
	
	diagnostics = validate("FROM node\n" + instruction + " \\\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + "\\\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\r\n" + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + "\\\r\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\r\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argument + "\\\n");
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\n" + argumentBack);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\r\n" + argumentBack);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\r\n" + argumentBack);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\r\n" + argumentBack + "\n");
	assert.equal(diagnostics.length, 0);
}

describe("Docker Validator Tests", function() {
	describe("instruction", function() {
		describe("uppercase style check", function() {
			function testCasingStyle(mixed: string, argument: string) {
				var length = mixed.length;
				let diagnostics = validate("FROM node\n" + mixed.toUpperCase() + " " + argument);
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + mixed.toLowerCase() + " " + argument);
				assert.equal(diagnostics.length, 1);
				assertInstructionCasing(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + mixed + " " + argument);
				assert.equal(diagnostics.length, 1);
				assertInstructionCasing(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n#" + mixed.toLowerCase() + " " + argument);
				assert.equal(diagnostics.length, 0);
			}

			it("ADD", function() {
				testCasingStyle("aDd", "source dest");
			});

			it("ARG", function() {
				testCasingStyle("aRg", "name");
			});

			it("CMD", function() {
				testCasingStyle("cMd", "[ \"/bin/ls\" ]");
			});

			it("COPY", function() {
				testCasingStyle("copY", "source dest");
			});

			it("ENTRYPOINT", function() {
				testCasingStyle("entryPOINT", "[ \"/usr/bin/sh\" ]");
			});

			it("ENV", function() {
				testCasingStyle("EnV", "key=value");
			});

			it("EXPOSE", function() {
				testCasingStyle("expOSe", "8080");
			});

			it("FROM", function() {
				testCasingStyle("fROm", "node");
			});

			it("HEALTHCHECK", function() {
				testCasingStyle("healTHCHeck", "NONE");
			});

			it("LABEL", function() {
				testCasingStyle("LAbel", "key=value");
			});

			it("ONBUILD", function() {
				testCasingStyle("onBUILD", "HEALTHCHECK NONE");
			});

			it("RUN", function() {
				testCasingStyle("rUN", "apt-get update");
			});

			it("SHELL", function() {
				testCasingStyle("shELL", "[ \"powershell\" ]");
			});

			it("STOPSIGNAL", function() {
				testCasingStyle("stopSIGNal", "9");
			});

			it("USER", function() {
				testCasingStyle("uSEr", "daemon");
			});

			it("VOLUME", function() {
				testCasingStyle("VOLume", "[ \"/data\" ]");
			});

			it("WORKDIR", function() {
				testCasingStyle("workDIR", "/path");
			});
		});

		describe("extra argument", function() {
			function testExtraArgument(prefix: string) {
				let length = prefix.length;
				let diagnostics = validate("FROM node\n" + prefix + " extra");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\r");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra ");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\t");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " \\\nextra");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 2, 0, 2, 5);

				diagnostics = validate("FROM node\n" + prefix + " \\\r\nextra");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 2, 0, 2, 5);

				diagnostics = validate("FROM node\n" + prefix + " \\\r\nextra");
				assert.equal(diagnostics.length, 1);
				assertInstructionExtraArgument(diagnostics[0], 2, 0, 2, 5);
			}

			it("FROM", function() {
				testExtraArgument("FROM node");
			});

			it("STOPSIGNAL", function() {
				testExtraArgument("STOPSIGNAL SIGTERM");
			});

			it("USER", function() {
				testExtraArgument("USER daemon");
			});

			it("WORKDIR", function() {
				testExtraArgument("WORKDIR /path/docker");
			});
		});

		describe("missing argument", function() {
			function testMissingArgument(instruction) {
				var length = instruction.length;
				let diagnostics = validate("FROM node\n" + instruction);
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + " ");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\r\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\\\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\\\r\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\\\n ");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\\\r\n ");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\\\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);

				diagnostics = validate("FROM node\n" + instruction + "\\\r\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);
			}

			it("ADD", function() {
				return testMissingArgument("ADD");
			});

			it("ARG", function() {
				return testMissingArgument("ARG");
			});

			it("CMD", function() {
				return testMissingArgument("CMD");
			});

			it("COPY", function() {
				return testMissingArgument("COPY");
			});

			it("ENTRYPOINT", function() {
			return testMissingArgument("ENTRYPOINT");
			});

			it("ENV", function() {
				return testMissingArgument("ENV");
			});

			it("EXPOSE", function() {
				return testMissingArgument("EXPOSE");
			});

			it("FROM", function() {
				return testMissingArgument("FROM");
			});

			it("HEALTHCHECK", function() {
				return testMissingArgument("HEALTHCHECK");
			});

			it("LABEL", function() {
				return testMissingArgument("LABEL");
			});

			it("ONBUILD", function() {
				return testMissingArgument("ONBUILD");
			});

			it("RUN", function() {
				return testMissingArgument("RUN");
			});

			it("SHELL", function() {
				return testMissingArgument("SHELL");
			});

			it("STOPSIGNAL", function() {
				return testMissingArgument("STOPSIGNAL");
			});

			it("USER", function() {
				return testMissingArgument("USER");
			});

			it("WORKDIR", function() {
				return testMissingArgument("WORKDIR");
			});
		});
	});

	describe("directives", function() {
		describe("unknown directive", function() {
			it("simple", function() {
				let diagnostics = validate("# key=value\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveUnknown(diagnostics[0], "key", 0, 2, 0, 5);
			});

			it("whitespace", function() {
				let diagnostics = validate("# key = value\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveUnknown(diagnostics[0], "key", 0, 2, 0, 5);
			});

			it("ignored after one comment", function() {
				let diagnostics = validate("# This is a comment\n# key=value\nFROM node");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("#\r# key=value\nFROM node");
				assert.equal(diagnostics.length, 0);
			});
		});

		describe("escape validation", function() {
			it("backtick", function() {
				let diagnostics = validate("# escape=`\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("whitespace", function() {
				let diagnostics = validate("# escape =  `  \nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("casing ignored", function() {
				let diagnostics = validate("# EsCaPe=`\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("invalid escape directive", function() {
				let diagnostics = validate("# escape=ab\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], "ab", 0, 9, 0, 11);

				diagnostics = validate("# escape=ab\r\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], "ab", 0, 9, 0, 11);
			});
		});
	});

	describe("EXPOSE", function() {
		it("ok", function() {
			testValidArgument("EXPOSE", "8080");
			testValidArgument("EXPOSE", "7000-8000");
		});

		it("escape", function() {
			let diagnostics = validate("FROM node\nEXPOSE 8080\\\n8081");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8080\\\r\n8081");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8080 \\\n8081");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n8080");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n 8080");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n8080\n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n 8080\n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n8080 \n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n 8080 \n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8080\\\n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 80\\\n80");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000-\\\n9000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000\\\n-9000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 80\\\r\n80");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000-\\\r\n9000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000\\\r\n-9000");
			assert.equal(diagnostics.length, 0);
		});

		it("invalid containerPort", function() {
			let diagnostics = validate("FROM node\nEXPOSE a");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\\\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE -8000");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE -8000 ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE -8000\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE -8000\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000-");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000- ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000-\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000-\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 80\\\n00-\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 2, 3);

			diagnostics = validate("FROM node\nEXPOSE 80\\\n00-");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 2, 3);

			diagnostics = validate("FROM node\nEXPOSE -");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-", 1, 7, 1, 8);
		});
	});

	describe("STOPSIGNAL", function() {
		it("ok", function() {
			testValidArgument("STOPSIGNAL", "9");
			testValidArgument("STOPSIGNAL", "SIGKILL");
		});

		it("escape", function() {
			let diagnostics = validate("FROM node\nSTOPSIGNAL \\\n9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL \\\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL\\\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL \\\r\n9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL\\\r\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL \\\r\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL 9\\\n");
			assert.equal(diagnostics.length, 0);

			testEscape("STOPSIGNAL", "SI", "GKILL");
			testEscape("STOPSIGNAL", "SIGK", "ILL");
		});

		it("invalid stop signal", function() {
			let diagnostics = validate("FROM node\nSTOPSIGNAL a");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a ");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a\r");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], 1, 11, 1, 12);
		});
	});

	describe("USER", function() {
		it("ok", function() {
			return testValidArgument("USER", "daemon");
		});

		it("escape", function() {
			return testEscape("USER", "dae", "mon");
		});
	});

	describe("VOLUME", function() {
		it("simple", function() {
			testValidArgument("VOLUME", "/var/log");
		});

		it("escape", function() {
			let diagnostics = validate("FROM node\nVOLUME /var/log \\\n /tmp");
			assert.equal(diagnostics.length, 0);
		});
	});

	describe("WORKDIR", function() {
		it("ok", function() {
			testValidArgument("WORKDIR", "/orion");
		});

		it("escape", function() {
			testEscape("WORKDIR", "/or", "ion");
		});
	});
});
