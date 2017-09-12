/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import {
	TextDocument, Position, Range, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { ValidationCode } from '../src/dockerValidator';
import { DockerCommands, CommandIds } from '../src/dockerCommands';

let uri = "uri://host/Dockerfile.sample";
let dockerCommands = new DockerCommands();

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function createExtraArgument(): Diagnostic {
	return Diagnostic.create(Range.create(Position.create(0, 0), Position.create(0, 0)), "", DiagnosticSeverity.Warning, ValidationCode.ARGUMENT_EXTRA);
}

function createInvalidEscapeDirective(): Diagnostic {
	return Diagnostic.create(Range.create(Position.create(0, 0), Position.create(0, 0)), "", DiagnosticSeverity.Warning, ValidationCode.INVALID_ESCAPE_DIRECTIVE);
}

function createUnknownHealthcheckFlag(): Diagnostic {
	return Diagnostic.create(Range.create(Position.create(0, 0), Position.create(0, 0)), "", DiagnosticSeverity.Error, ValidationCode.UNKNOWN_HEALTHCHECK_FLAG);
}

function createDirectiveUppercase(): Diagnostic {
	return Diagnostic.create(Range.create(Position.create(0, 0), Position.create(0, 0)), "", DiagnosticSeverity.Warning, ValidationCode.CASING_DIRECTIVE);
}

function createLowercase(): Diagnostic {
	return Diagnostic.create(Range.create(Position.create(0, 0), Position.create(0, 0)), "", DiagnosticSeverity.Warning, ValidationCode.CASING_INSTRUCTION);
}

function createAS(): Diagnostic {
	return Diagnostic.create(Range.create(Position.create(0, 0), Position.create(0, 0)), "", DiagnosticSeverity.Error, ValidationCode.INVALID_AS);
}

function assertRange(actual: Range, expected: Range) {
	assert.equal(actual.start.line, expected.start.line);
	assert.equal(actual.start.character, expected.start.character);
	assert.equal(actual.end.line, expected.end.line);
	assert.equal(actual.end.character, expected.start.character);
}

describe("Dockerfile code actions", function () {
	it("no diagnostics", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let commands = dockerCommands.analyzeDiagnostics([], uri, range);
		assert.equal(commands.length, 0);
	});

	it("extra argument", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let diagnostic = createExtraArgument();
		let commands = dockerCommands.analyzeDiagnostics([ diagnostic ], uri, range);
		assert.equal(commands.length, 1);
		assert.equal(commands[0].command, CommandIds.EXTRA_ARGUMENT);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], diagnostic.range);
	});

	it("invalid escape directive", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let diagnostic = createInvalidEscapeDirective();
		let commands = dockerCommands.analyzeDiagnostics([ diagnostic ], uri, range);
		assert.equal(commands.length, 2);
		assert.equal(commands[0].command, CommandIds.DIRECTIVE_TO_BACKSLASH);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], diagnostic.range);
		assert.equal(commands[1].command, CommandIds.DIRECTIVE_TO_BACKTICK);
		assert.equal(commands[1].arguments.length, 2);
		assert.equal(commands[1].arguments[0], uri);
		assertRange(commands[1].arguments[1], diagnostic.range);
	});

	it("convert to uppercase", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let diagnostic = createLowercase();
		let commands = dockerCommands.analyzeDiagnostics([ diagnostic ], uri, range);
		assert.equal(commands.length, 1);
		assert.equal(commands[0].command, CommandIds.UPPERCASE);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], diagnostic.range);
	});

	it("convert to lowercase", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let diagnostic = createDirectiveUppercase();
		let commands = dockerCommands.analyzeDiagnostics([ diagnostic ], uri, range);
		assert.equal(commands.length, 1);
		assert.equal(commands[0].command, CommandIds.LOWERCASE);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], diagnostic.range);
	});

	it("convert to AS", function () {
		let diagnostic = createAS();
		let commands = dockerCommands.analyzeDiagnostics([ diagnostic ], uri, diagnostic.range);
		assert.equal(commands.length, 1);
		assert.equal(commands[0].command, CommandIds.CONVERT_TO_AS);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], diagnostic.range);
	});

	it("multiple diagnostics", function() {
		let escape = createInvalidEscapeDirective();
		let lowercase = createLowercase();
		let commands = dockerCommands.analyzeDiagnostics([ escape, lowercase ], uri, Range.create(Position.create(0, 0), Position.create(0, 4)));
		assert.equal(commands.length, 3);
		assert.equal(commands[0].command, CommandIds.DIRECTIVE_TO_BACKSLASH);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], escape.range);
		assert.equal(commands[1].command, CommandIds.DIRECTIVE_TO_BACKTICK);
		assert.equal(commands[1].arguments.length, 2);
		assert.equal(commands[1].arguments[0], uri);
		assertRange(commands[1].arguments[1], escape.range);
		assert.equal(commands[2].command, CommandIds.UPPERCASE);
		assert.equal(commands[2].arguments.length, 2);
		assert.equal(commands[2].arguments[0], uri);
		assertRange(commands[2].arguments[1], lowercase.range);
	});

	it("diagnostic code as string", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let diagnostic = createLowercase();
		diagnostic.code = diagnostic.code.toString();
		let commands = dockerCommands.analyzeDiagnostics([ diagnostic ], uri, range);
		assert.equal(commands.length, 1);
		assert.equal(commands[0].command, CommandIds.UPPERCASE);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], diagnostic.range);
	});

	it("unknown HEALTHCHECK flags", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let diagnostic = createUnknownHealthcheckFlag();
		let commands = dockerCommands.analyzeDiagnostics([ diagnostic ], uri, range);
		assert.equal(commands.length, 4);
		assert.equal(commands[0].command, CommandIds.FLAG_TO_HEALTHCHECK_INTERVAL);
		assert.equal(commands[0].arguments.length, 2);
		assert.equal(commands[0].arguments[0], uri);
		assertRange(commands[0].arguments[1], diagnostic.range);
		assert.equal(commands[1].command, CommandIds.FLAG_TO_HEALTHCHECK_RETRIES);
		assert.equal(commands[1].arguments.length, 2);
		assert.equal(commands[1].arguments[0], uri);
		assertRange(commands[1].arguments[1], diagnostic.range);
		assert.equal(commands[2].command, CommandIds.FLAG_TO_HEALTHCHECK_START_PERIOD);
		assert.equal(commands[2].arguments.length, 2);
		assert.equal(commands[2].arguments[0], uri);
		assertRange(commands[2].arguments[1], diagnostic.range);
		assert.equal(commands[3].command, CommandIds.FLAG_TO_HEALTHCHECK_TIMEOUT);
		assert.equal(commands[3].arguments.length, 2);
		assert.equal(commands[3].arguments[0], uri);
		assertRange(commands[3].arguments[1], diagnostic.range);
	});
});

describe("Dockerfile execute commands", function () {
	it("unknown command", function () {
		let document = createDocument("FROM node");
		let edit = dockerCommands.createWorkspaceEdit(document, { command: "unknown", arguments: [] });
		assert.equal(edit, null);
	});

	function directiveTo(commandId: string, suggestion: string) {
		let range = Range.create(Position.create(0, 8), Position.create(0, 9));
		let document = createDocument("#escape=a");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: commandId,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, suggestion);
		assert.equal(edits[0].range, range);
	}

	it("directive to backslash", function () {
		directiveTo(CommandIds.DIRECTIVE_TO_BACKSLASH, '\\');
	});

	it("directive to backtick", function () {
		directiveTo(CommandIds.DIRECTIVE_TO_BACKTICK, '`');
	});

	it("extra argument", function () {
		let range = Range.create(Position.create(0, 10), Position.create(0, 14));
		let document = createDocument("FROM node node");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.EXTRA_ARGUMENT,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "");
		assert.equal(edits[0].range, range);
	});

	it("convert to uppercase", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let document = createDocument("from node");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.UPPERCASE,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "FROM");
		assert.equal(edits[0].range, range);
	});

	it("convert to lowercase", function () {
		let range = Range.create(Position.create(0, 1), Position.create(0, 7));
		let document = createDocument("#ESCAPE=`");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.LOWERCASE,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "escape");
		assert.equal(edits[0].range, range);
	});

	it("convert to AS", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let document = createDocument("FROM node as setup");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.CONVERT_TO_AS,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "AS");
		assert.equal(edits[0].range, range);
	});

	it("HEALTHCHECK flag to --interval", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let document = createDocument("");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.FLAG_TO_HEALTHCHECK_INTERVAL,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "interval");
		assert.equal(edits[0].range, range);
	});

	it("HEALTHCHECK flag to --retries", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let document = createDocument("");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.FLAG_TO_HEALTHCHECK_RETRIES,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "retries");
		assert.equal(edits[0].range, range);
	});

	it("HEALTHCHECK flag to --start-period", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let document = createDocument("");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.FLAG_TO_HEALTHCHECK_START_PERIOD,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "start-period");
		assert.equal(edits[0].range, range);
	});

	it("HEALTHCHECK flag to --timeout", function () {
		let range = Range.create(Position.create(0, 0), Position.create(0, 4));
		let document = createDocument("");
		let edit = dockerCommands.createWorkspaceEdit(document, {
			command: CommandIds.FLAG_TO_HEALTHCHECK_TIMEOUT,
			arguments: [ uri, range ]
		});
		assert.equal(edit.documentChanges, undefined);
		let edits = edit.changes[uri];
		assert.equal(edits.length, 1);
		assert.equal(edits[0].newText, "timeout");
		assert.equal(edits[0].range, range);
	});
});
