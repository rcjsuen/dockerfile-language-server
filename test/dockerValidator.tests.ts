/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import {
	TextDocument, Position, Range, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { Validator, ValidationCode, ValidationSeverity, ValidatorSettingsDefaults } from '../src/dockerValidator';
import { ValidatorSettings } from '../src/dockerValidatorSettings';
import { KEYWORDS } from '../src/docker';

let source = "dockerfile-lsp";
let uri = "uri://host/Dockerfile.sample";

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function validate(content: string, settings?: ValidatorSettings) {
	if (!settings) {
		settings = {
			deprecatedMaintainer: ValidationSeverity.IGNORE
		};
	}
	let validator = new Validator(settings);
	return validator.validate(KEYWORDS, createDocument(content));
}

function assertDiagnostics(diagnostics: Diagnostic[], codes: ValidationCode[], functions: Function[], args: any[][]) {
	diagnosticCheck: for (let diagnostic of diagnostics) {
		for (let i = 0; i < codes.length; i++) {
			if (diagnostic.code === codes[i]) {
				args[i].unshift(diagnostic);
				functions[i].apply(null, args[i]);
				continue diagnosticCheck;
			}
		}
	}
}

function assertNoSourceImage(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.NO_SOURCE_IMAGE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_NoSourceImage());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
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

function assertInvalidStopSignal(diagnostic: Diagnostic, signal: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_SIGNAL);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidSignal(signal));
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
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_EXTRA);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionExtraArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionMissingArgument(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_MISSING);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionMissingArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionRequiresOneOrThreeArguments(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_REQUIRES_ONE_OR_THREE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionRequiresOneOrThreeArguments());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionUnknown(diagnostic: Diagnostic, instruction: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.UNKNOWN_INSTRUCTION);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionUnknown(instruction));
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

function assertDeprecatedMaintainer(diagnostic: Diagnostic, severity: DiagnosticSeverity, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.DEPRECATED_MAINTAINER);
	assert.equal(diagnostic.severity, severity);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_DeprecatedMaintainer());
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
	describe("no content", function() {
		it("empty file", function() {
			let diagnostics = validate("");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("whitespace only", function() {
			let diagnostics = validate(" \t\r\n");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("comments only", function() {
			let diagnostics = validate("# This is a comment");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);

			diagnostics = validate("#=This is a comment");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("directive only", function() {
			let diagnostics = validate("# escape=`");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);

			diagnostics = validate("# escape=\\");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("FROM in comment", function() {
			let diagnostics = validate("# FROM node");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});
	});

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

			it("MAINTAINER", function() {
				testCasingStyle("maINTaiNER", "authorName");
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
			function testExtraArgument(prefix: string, assertDiagnostic: Function) {
				let length = prefix.length;
				let diagnostics = validate("FROM node\n" + prefix + " extra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\r");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra ");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\t");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\n");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " \\\nextra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 2, 0, 2, 5);

				diagnostics = validate("FROM node\n" + prefix + " \\\r\nextra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 2, 0, 2, 5);

				diagnostics = validate("FROM node\n" + prefix + " \\\r\nextra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 2, 0, 2, 5);
			}

			it("FROM", function() {
				testExtraArgument("FROM node", assertInstructionRequiresOneOrThreeArguments);
			});

			it("STOPSIGNAL", function() {
				testExtraArgument("STOPSIGNAL SIGTERM", assertInstructionExtraArgument);
			});

			it("USER", function() {
				testExtraArgument("USER daemon", assertInstructionExtraArgument);
			});

			it("WORKDIR", function() {
				testExtraArgument("WORKDIR /path/docker", assertInstructionExtraArgument);
			});
		});

		describe("missing argument", function() {
			function testMissingArgument(instruction, prefix, middle, suffix) {
				var length = instruction.length;
				let diagnostics = validate("FROM node\n" + instruction + prefix + middle + suffix);
				assert.equal(diagnostics.length, 1);
				assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);
			}

			function testMissingArgumentLoop(instruction) {
				let newlines = [ "", "\r", "\n", "\r\n", "\\\r", "\\\n", "\\\r\n" ];
				for (let newline of newlines) {
					testMissingArgument(instruction, "", newline, "");
					testMissingArgument(instruction, "", newline, " ");
					testMissingArgument(instruction, " ", newline, "");
					testMissingArgument(instruction, " ", newline, " ");
					testMissingArgument(instruction, "", newline, "\t");
					testMissingArgument(instruction, "\t", newline, "");
					testMissingArgument(instruction, "\t", newline, "\t");
				}
			}

			it("ADD", function() {
				return testMissingArgumentLoop("ADD");
			});

			it("ARG", function() {
				return testMissingArgumentLoop("ARG");
			});

			it("CMD", function() {
				return testMissingArgumentLoop("CMD");
			});

			it("COPY", function() {
				return testMissingArgumentLoop("COPY");
			});

			it("ENTRYPOINT", function() {
				return testMissingArgumentLoop("ENTRYPOINT");
			});

			it("ENV", function() {
				return testMissingArgumentLoop("ENV");
			});

			it("EXPOSE", function() {
				return testMissingArgumentLoop("EXPOSE");
			});

			it("FROM", function() {
				return testMissingArgumentLoop("FROM");
			});

			it("HEALTHCHECK", function() {
				return testMissingArgumentLoop("HEALTHCHECK");
			});

			it("LABEL", function() {
				return testMissingArgumentLoop("LABEL");
			});

			it("MAINTAINER", function() {
				return testMissingArgumentLoop("MAINTAINER");
			});

			it("ONBUILD", function() {
				return testMissingArgumentLoop("ONBUILD");
			});

			it("RUN", function() {
				return testMissingArgumentLoop("RUN");
			});

			it("SHELL", function() {
				return testMissingArgumentLoop("SHELL");
			});

			it("STOPSIGNAL", function() {
				return testMissingArgumentLoop("STOPSIGNAL");
			});

			it("USER", function() {
				return testMissingArgumentLoop("USER");
			});

			it("WORKDIR", function() {
				return testMissingArgumentLoop("WORKDIR");
			});
		});

		describe("unknown", function () {
			it("simple", function () {
				let diagnostics = validate("FROM node\nRUNCMD docker");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);

				diagnostics = validate("FROM node\nRUNCMD docker\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);

				diagnostics = validate("FROM node\nRUNCMD docker\r\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);

				diagnostics = validate("FROM node\nRUNCMD docker\\\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);
			});

			it("escape", function () {
				let diagnostics = validate("FROM node\nSTOPSIGNAL\\\n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\\n9 ");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\\r\n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\\r\n9 ");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("\\FROM node");
				assert.equal(diagnostics.length, 2);
				assertDiagnostics(diagnostics,
					[ ValidationCode.UNKNOWN_INSTRUCTION, ValidationCode.NO_SOURCE_IMAGE ],
					[ assertInstructionUnknown, assertNoSourceImage ],
					[ [ "\\FROM", 0, 0, 0, 5 ], [ 0, 0, 0, 5 ] ]);
			});

			/**
			 * Checks that an unknown instruction that is written in lowercase only
			 * receives one error about the unknown instruction.
			 */
			it("does not overlap with casing", function () {
				let diagnostics = validate("FROM node\nruncmd docker");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);
			});
		});

		describe("first instruction not FROM", function() {
			it("one line", function() {
				let diagnostics = validate("EXPOSE 8080");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 6);
			});

			it("two lines", function() {
				let diagnostics = validate("EXPOSE 8080\n# another line");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 6);
			});

			it("two instructions", function() {
				let diagnostics = validate("EXPOSE 8080\nEXPOSE 8081");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 6);
			});

			it("comments ignored", function() {
				let diagnostics = validate("# FROM node\nEXPOSE 8080");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 1, 0, 1, 6);
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

			it("simple EOF", function() {
				let diagnostics = validate("# key=value");
				assert.equal(diagnostics.length, 2);
				assertDiagnostics(diagnostics,
					[ ValidationCode.UNKNOWN_DIRECTIVE, ValidationCode.NO_SOURCE_IMAGE ],
					[ assertDirectiveUnknown, assertNoSourceImage ],
					[ [ "key", 0, 2, 0, 5 ], [ 0, 0, 0, 0 ] ]);
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

				diagnostics = validate("#=# key=value\nFROM node");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("#=# key=value\r\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("ignored after one instruction", function() {
				let diagnostics = validate("FROM node\n# key=value");
				assert.equal(diagnostics.length, 0);
			});

			it("whitespace directive", function() {
				let diagnostics = validate("#escape= \nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], " ", 0, 8, 0, 9);
				
				diagnostics = validate("#escape=\t\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], "\t", 0, 8, 0, 9);
			});

			it("EOF", function() {
				let diagnostics = validate("#escape=");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
			});

			it("EOF newline", function() {
				let diagnostics = validate("#escape=\n");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
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

			diagnostics = validate("FROM node\nEXPOSE a\r");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\r\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\\\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE ab\\\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "ab", 1, 7, 1, 9);

			diagnostics = validate("FROM node\nEXPOSE a\r");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\\\r ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE ab\\\r ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "ab", 1, 7, 1, 9);

			diagnostics = validate("FROM node\nEXPOSE a\r\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\\\r\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE ab\\\r\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "ab", 1, 7, 1, 9);

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

			diagnostics = validate("FROM node\nEXPOSE \\a");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "\\a", 1, 7, 1, 9);
		});
	});

	describe("FROM", function() {
		describe("source image", function() {
			it("ok", function() {
				let diagnostics = validate("FROM node");
				assert.equal(diagnostics.length, 0);
			});
		});

		describe("build stage", function() {
			it("ok", function() {
				let diagnostics = validate("FROM node AS setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node As setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node aS setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node as setup");
				assert.equal(diagnostics.length, 0);
			});
		});

		describe("wrong args number", function() {
			it("two", function() {
				let diagnostics = validate("FROM node AS");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 10, 0, 12);

				diagnostics = validate("FROM node As \\\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 10, 0, 12);

				diagnostics = validate("FROM node test");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 10, 0, 14);
			});

			it("four", function() {
				let diagnostics = validate("FROM node AS setup again");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 19, 0, 24);

				diagnostics = validate("FROM node As \\\nsetup two");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 1, 6, 1, 9);
			});
		});
	});

	describe("MAINTAINER", function() {
		it("default", function() {
			let validator = new Validator();
			let diagnostics = validator.validate(KEYWORDS, createDocument("FROM node\nMAINTAINER author"));
			assert.equal(diagnostics.length, 1);
			assertDeprecatedMaintainer(diagnostics[0], DiagnosticSeverity.Warning, 1, 0, 1, 10);
		});

		it("ignore", function() {
			let diagnostics = validate("FROM node\nMAINTAINER author", { deprecatedMaintainer: ValidationSeverity.IGNORE });
			assert.equal(diagnostics.length, 0);
		});

		it("warning", function() {
			let diagnostics = validate("FROM node\nMAINTAINER author", { deprecatedMaintainer: ValidationSeverity.WARNING });
			assert.equal(diagnostics.length, 1);
			assertDeprecatedMaintainer(diagnostics[0], DiagnosticSeverity.Warning, 1, 0, 1, 10);
		});

		it("error", function() {
			let diagnostics = validate("FROM node\nMAINTAINER author", { deprecatedMaintainer: ValidationSeverity.ERROR });
			assert.equal(diagnostics.length, 1);
			assertDeprecatedMaintainer(diagnostics[0], DiagnosticSeverity.Error, 1, 0, 1, 10);
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
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a ");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a\r");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);
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
