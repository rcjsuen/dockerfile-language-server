/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as child_process from "child_process";
import * as assert from "assert";

import {
	TextDocument, Position, Range,
	CompletionItem, CompletionItemKind, InsertTextFormat
} from 'vscode-languageserver';
import { KEYWORDS } from '../src/docker';
import { DockerAssist } from '../src/dockerAssist';

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function compute(content, offset): CompletionItem[] {
	let assist = new DockerAssist(createDocument(content), true);
	return assist.computeProposals(content, offset);
}

function assertOnlyFROM(proposals, line, number, prefixLength) {
	assert.equal(proposals.length, 1);
	assertFROM(proposals[0], line, number, prefixLength);
}

function assertADD(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "ADD source dest");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "ADD ${1:source} ${2:dest}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertARG_NameOnly(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "ARG name");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "ARG ${1:name}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertARG_DefaultValue(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "ARG name=defaultValue");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "ARG ${1:name}=${2:defaultValue}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertCMD(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "CMD [ \"executable\" ]");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "CMD [ \"${1:executable}\" ]");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertCOPY(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "COPY source dest");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "COPY ${1:source} ${2:dest}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertENTRYPOINT(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "ENTRYPOINT [ \"executable\" ]");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "ENTRYPOINT [ \"${1:executable}\" ]");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertENV(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "ENV key=value");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "ENV ${1:key}=${2:value}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertEXPOSE(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "EXPOSE port");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "EXPOSE ${1:port}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertFROM(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "FROM baseImage");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "FROM ${1:baseImage}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertHEALTHCHECK_CMD(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "HEALTHCHECK --interval=30s --timeout=30s --retries=3 CMD [ \"executable\" ]");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "HEALTHCHECK --interval=${1:30s} --timeout=${2:30s} --retries=${3:3} CMD [ \"${4:executable}\" ]");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertHEALTHCHECK_NONE(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "HEALTHCHECK NONE");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "HEALTHCHECK NONE");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertLABEL(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "LABEL key=\"value\"");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "LABEL ${1:key}=\"${2:value}\"");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertMAINTAINER(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "MAINTAINER name");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "MAINTAINER ${1:name}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertONBUILD(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "ONBUILD INSTRUCTION");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "ONBUILD ${1:INSTRUCTION}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertRUN(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "RUN command");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "RUN ${1:command}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertSHELL(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "SHELL [ \"executable\" ]");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "SHELL [ \"${1:executable}\" ]");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertSTOPSIGNAL(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "STOPSIGNAL signal");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "STOPSIGNAL ${1:signal}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertUSER(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "USER daemon");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "USER ${1:daemon}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertVOLUME(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "VOLUME [ \"/data\" ]");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "VOLUME [ \"${1:/data}\" ]");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertWORKDIR(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "WORKDIR /path");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "WORKDIR ${1:/path}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertOnlyDirectiveEscape(items: CompletionItem[], line: number, character: number, prefixLength: number) {
	assert.equal(1, items.length);
	assertDirectiveEscape(items[0], line, character, prefixLength);
}

function assertDirectiveEscape(item: CompletionItem, line: number, character: number, prefixLength: number) {
	assert.equal(item.label, "escape=`");
	assert.equal(item.kind, CompletionItemKind.Keyword);
	assert.equal(item.insertTextFormat, InsertTextFormat.Snippet);
	assert.equal(item.textEdit.newText, "escape=${1:`}");
	assert.equal(item.textEdit.range.start.line, line);
	assert.equal(item.textEdit.range.start.character, character);
	assert.equal(item.textEdit.range.end.line, line);
	assert.equal(item.textEdit.range.end.character, character + prefixLength);
}

function assertProposals(proposals, offset, prefix, prefixLength) {
	for (var i = 0; i < proposals.length; i++) {
		switch (proposals[i].data) {
			case "ADD":
				assertADD(proposals[i], offset, prefix, prefixLength);
				break;
			case "ARG_DefaultValue":
				assertARG_DefaultValue(proposals[i], offset, prefix, prefixLength);
				break;
			case "ARG_NameOnly":
				assertARG_NameOnly(proposals[i++], offset, prefix, prefixLength);
				break;
			case "CMD":
				assertCMD(proposals[i], offset, prefix, prefixLength);
				break;
			case "COPY":
				assertCOPY(proposals[i], offset, prefix, prefixLength);
				break;
			case "ENTRYPOINT":
				assertENTRYPOINT(proposals[i], offset, prefix, prefixLength);
				break;
			case "ENV":
				assertENV(proposals[i], offset, prefix, prefixLength);
				break;
			case "EXPOSE":
				assertEXPOSE(proposals[i], offset, prefix, prefixLength);
				break;
			case "FROM":
				assertFROM(proposals[i], offset, prefix, prefixLength);
				break;
			case "HEALTHCHECK_CMD":
				assertHEALTHCHECK_CMD(proposals[i++], offset, prefix, prefixLength);
				break;
			case "HEALTHCHECK_NONE":
				assertHEALTHCHECK_NONE(proposals[i], offset, prefix, prefixLength);
				break;
			case "LABEL":
				assertLABEL(proposals[i], offset, prefix, prefixLength);
				break;
			case "MAINTAINER":
				assertMAINTAINER(proposals[i], offset, prefix, prefixLength);
				break;
			case "ONBUILD":
				assertONBUILD(proposals[i], offset, prefix, prefixLength);
				break;
			case "RUN":
				assertRUN(proposals[i], offset, prefix, prefixLength);
				break;
			case "SHELL":
				assertSHELL(proposals[i], offset, prefix, prefixLength);
				break;
			case "STOPSIGNAL":
				assertSTOPSIGNAL(proposals[i], offset, prefix, prefixLength);
				break;
			case "USER":
				assertUSER(proposals[i], offset, prefix, prefixLength);
				break;
			case "VOLUME":
				assertVOLUME(proposals[i], offset, prefix, prefixLength);
				break;
			case "WORKDIR":
				assertWORKDIR(proposals[i], offset, prefix, prefixLength);
				break;
			default:
				throw new Error("Unknown proposal name: " + proposals[i].data);
		}
	}
}

function assertONBUILDProposals(proposals, offset, prefix, prefixLength) {
	// +1 for two ARG proposals
	// +1 for two HEALTHCHECK proposals
	// -3 for ONBUILD, FROM, MAINTAINER
	assert.equal(proposals.length, KEYWORDS.length - 1);
	assertProposals(proposals, offset, prefix, prefixLength);
}

function assertAllProposals(proposals, offset, prefix, prefixLength) {
	// +1 for two ARG proposals
	// +1 for two HEALTHCHECK proposals
	assert.equal(proposals.length, KEYWORDS.length + 2);
	assertProposals(proposals, offset, prefix, prefixLength);
}

describe('Docker Content Assist Tests', function() {
	describe('no content', function() {
		it('empty file', function() {
			var proposals = compute("", 0);
			assertOnlyFROM(proposals, 0, 0, 0);
		});

		it('whitespace', function() {
			var proposals = compute(" ", 0);
			assertOnlyFROM(proposals, 0, 0, 0);

			proposals = compute("\n", 0);
			assertOnlyFROM(proposals, 0, 0, 0);

			proposals = compute("\r", 1);
			assertOnlyFROM(proposals, 1, 0, 0);

			proposals = compute("\r\n", 2);
			assertOnlyFROM(proposals, 1, 0, 0);
		});
	});

	describe('comments only', function() {
		it('in comment', function() {
			var proposals = compute("# abc\n", 6);
			assertOnlyFROM(proposals, 1, 0, 0);

			proposals = compute("# abc", 5);
			assert.equal(proposals.length, 0);

			proposals = compute("#FROM", 5);
			assert.equal(proposals.length, 0);
		});

		it('outside comment', function() {
			var proposals = compute("# abc", 0);
			assertOnlyFROM(proposals, 0, 0, 0);
		});
	});

	describe('keywords', function() {
		it('none', function() {
			var proposals = compute("F ", 2);
			assert.equal(proposals.length, 0);
		});

		it('all', function() {
			var proposals = compute("FROM node\n", 10);
			assertAllProposals(proposals, 1, 0, 0);

			proposals = compute("FROM node\n", 0);
			assertAllProposals(proposals, 0, 0, 0);

			proposals = compute("FROM node\n\t", 11);
			assertAllProposals(proposals, 1, 1, 0);

			proposals = compute("FROM node\n  ", 12);
			assertAllProposals(proposals, 1, 2, 0);
		});

		it('prefix', function() {
			var proposals = compute("#F", 2);
			assert.equal(proposals.length, 0);

			proposals = compute("# F", 3);
			assert.equal(proposals.length, 0);

			proposals = compute("F", 1);
			assertOnlyFROM(proposals, 0, 0, 1);

			proposals = compute("F ", 1);
			assertOnlyFROM(proposals, 0, 0, 1);

			proposals = compute(" F", 2);
			assertOnlyFROM(proposals, 0, 1, 1);

			proposals = compute("F\n", 1);
			assertOnlyFROM(proposals, 0, 0, 1);

			proposals = compute("FROM", 4);
			assert.equal(0, proposals.length);

			proposals = compute("from", 4);
			assert.equal(0, proposals.length);

			proposals = compute("FROM node\nA", 11);
			assert.equal(proposals.length, 3);
			assertADD(proposals[0], 1, 0, 1);
			assertARG_NameOnly(proposals[1], 1, 0, 1);
			assertARG_DefaultValue(proposals[2], 1, 0, 1);

			proposals = compute("FROM node\na", 11);
			assert.equal(proposals.length, 3);
			assertADD(proposals[0], 1, 0, 1);
			assertARG_NameOnly(proposals[1], 1, 0, 1);
			assertARG_DefaultValue(proposals[2], 1, 0, 1);

			proposals = compute("FROM node\nH", 11);
			assert.equal(proposals.length, 2);
			assertHEALTHCHECK_CMD(proposals[0], 1, 0, 1);
			assertHEALTHCHECK_NONE(proposals[1], 1, 0, 1);

			proposals = compute("FROM node\nh", 11);
			assert.equal(proposals.length, 2);
			assertHEALTHCHECK_CMD(proposals[0], 1, 0, 1);
			assertHEALTHCHECK_NONE(proposals[1], 1, 0, 1);

			proposals = compute("FROM node O", 10);
			assert.equal(proposals.length, 0);
		});
	});

	describe("escape", function() {
		it("no instruction", function() {
			var content = "FROM node\n\\";
			var proposals = compute(content, content.length);
			assert.equal(proposals.length, 0);

			content = "FROM node\n\\\n";
			proposals = compute(content, content.length);
			assertAllProposals(proposals, 2, 0, 0);

			content = "FROM node\r\n\\";
			proposals = compute(content, content.length);
			assert.equal(proposals.length, 0);

			content = "FROM node\n\\\r\n";
			proposals = compute(content, content.length);
			assertAllProposals(proposals, 2, 0, 0);

			content = "\\";
			proposals = compute(content, content.length);
			assert.equal(proposals.length, 0);
		});

		function testEscape(header, instruction, escapeChar) {
			var content = header + "FROM node\n" + instruction + escapeChar + "\n";
			var proposals = compute(content, content.length);
			assert.equal(proposals.length, 0);

			content = header + "FROM node\n" + instruction + escapeChar + "\r\n";
			proposals = compute(content, content.length);
			assert.equal(proposals.length, 0);

			content = header + "FROM node\n" + instruction + " " + escapeChar + "\n";
			proposals = compute(content, content.length);
			if (instruction === "ONBUILD") {
				let split = content.split("\n");
				let lastLine = split.length - 1;
				assertONBUILDProposals(proposals, lastLine, 0, 0);
			} else {
				assert.equal(proposals.length, 0);
			}

			content = header + "FROM node\n" + instruction + " " + escapeChar + "\r\n";
			proposals = compute(content, content.length);
			if (instruction === "ONBUILD") {
				let split = content.split("\n");
				let lastLine = split.length - 1;
				assertONBUILDProposals(proposals, lastLine, 0, 0);
			} else {
				assert.equal(proposals.length, 0);
			}

			content = header + "FROM node\n" + instruction + escapeChar + "\n ";
			proposals = compute(content, content.length);
			if (instruction === "ONBUILD") {
				let lastLine = content.split("\n").length;
				assertONBUILDProposals(proposals, lastLine - 1, 1, 0);
			} else {
				assert.equal(proposals.length, 0);
			}

			content = header + "FROM node\n" + instruction + escapeChar + "\r\n ";
			proposals = compute(content, content.length);
			if (instruction === "ONBUILD") {
				let lastLine = content.split("\n").length;
				assertONBUILDProposals(proposals, lastLine - 1, 1, 0);
			} else {
				assert.equal(proposals.length, 0);
			}

			content = header + "FROM node\n" + instruction + " " + escapeChar + "\n ";
			proposals = compute(content, content.length);
			if (instruction === "ONBUILD") {
				let lastLine = content.split("\n").length;
				assertONBUILDProposals(proposals, lastLine - 1, 1, 0);
			} else {
				assert.equal(proposals.length, 0);
			}

			content = header + "FROM node\n" + instruction + " " + escapeChar + "\r\n ";
			proposals = compute(content, content.length);
			if (instruction === "ONBUILD") {
				let lastLine = content.split("\n").length;
				assertONBUILDProposals(proposals, lastLine - 1, 1, 0);
			} else {
				assert.equal(proposals.length, 0);
			}
		}
		
		it("no header", function() {
			testEscape("", "ADD", "\\");
			testEscape("", "ARG", "\\");
			testEscape("", "CMD", "\\");
			testEscape("", "COPY", "\\");
			testEscape("", "ENTRYPOINT", "\\");
			testEscape("", "ENV", "\\");
			testEscape("", "EXPOSE", "\\");
			testEscape("", "FROM", "\\");
			testEscape("", "HEALTHCHECK", "\\");
			testEscape("", "LABEL", "\\");
			testEscape("", "MAINTAINER", "\\");
			testEscape("", "ONBUILD", "\\");
			testEscape("", "RUN", "\\");
			testEscape("", "SHELL", "\\");
			testEscape("", "STOPSIGNAL", "\\");
			testEscape("", "USER", "\\");
			testEscape("", "VOLUME", "\\");
			testEscape("", "WORKDIR", "\\");
		});

		it("#escape=\\n", function() {
			testEscape("#escape=\n", "ADD", "\\");
			testEscape("#escape=\n", "ARG", "\\");
			testEscape("#escape=\n", "CMD", "\\");
			testEscape("#escape=\n", "COPY", "\\");
			testEscape("#escape=\n", "ENTRYPOINT", "\\");
			testEscape("#escape=\n", "ENV", "\\");
			testEscape("#escape=\n", "EXPOSE", "\\");
			testEscape("#escape=\n", "FROM", "\\");
			testEscape("#escape=\n", "HEALTHCHECK", "\\");
			testEscape("#escape=\n", "LABEL", "\\");
			testEscape("#escape=\n", "MAINTAINER", "\\");
			testEscape("#escape=\n", "ONBUILD", "\\");
			testEscape("#escape=\n", "RUN", "\\");
			testEscape("#escape=\n", "SHELL", "\\");
			testEscape("#escape=\n", "STOPSIGNAL", "\\");
			testEscape("#escape=\n", "USER", "\\");
			testEscape("#escape=\n", "VOLUME", "\\");
			testEscape("#escape=\n", "WORKDIR", "\\");
		});

		it("#escape=`\\n", function() {
			testEscape("#escape=`\n", "ADD", "`");
			testEscape("#escape=`\n", "ARG", "`");
			testEscape("#escape=`\n", "CMD", "`");
			testEscape("#escape=`\n", "COPY", "`");
			testEscape("#escape=`\n", "ENTRYPOINT", "`");
			testEscape("#escape=`\n", "ENV", "`");
			testEscape("#escape=`\n", "EXPOSE", "`");
			testEscape("#escape=`\n", "FROM", "`");
			testEscape("#escape=`\n", "HEALTHCHECK", "`");
			testEscape("#escape=`\n", "LABEL", "`");
			testEscape("#escape=`\n", "MAINTAINER", "`");
			testEscape("#escape=`\n", "ONBUILD", "`");
			testEscape("#escape=`\n", "RUN", "`");
			testEscape("#escape=`\n", "SHELL", "`");
			testEscape("#escape=`\n", "STOPSIGNAL", "`");
			testEscape("#escape=`\n", "USER", "`");
			testEscape("#escape=`\n", "VOLUME", "`");
			testEscape("#escape=`\n", "WORKDIR", "`");
		});
		
		it("#EsCaPe=`\\n", function() {
			testEscape("#EsCaPe=`\n", "ADD", "`");
			testEscape("#EsCaPe=`\n", "ARG", "`");
			testEscape("#EsCaPe=`\n", "CMD", "`");
			testEscape("#EsCaPe=`\n", "COPY", "`");
			testEscape("#EsCaPe=`\n", "ENTRYPOINT", "`");
			testEscape("#EsCaPe=`\n", "ENV", "`");
			testEscape("#EsCaPe=`\n", "EXPOSE", "`");
			testEscape("#EsCaPe=`\n", "FROM", "`");
			testEscape("#EsCaPe=`\n", "HEALTHCHECK", "`");
			testEscape("#EsCaPe=`\n", "LABEL", "`");
			testEscape("#EsCaPe=`\n", "MAINTAINER", "`");
			testEscape("#EsCaPe=`\n", "ONBUILD", "`");
			testEscape("#EsCaPe=`\n", "RUN", "`");
			testEscape("#EsCaPe=`\n", "SHELL", "`");
			testEscape("#EsCaPe=`\n", "STOPSIGNAL", "`");
			testEscape("#EsCaPe=`\n", "USER", "`");
			testEscape("#EsCaPe=`\n", "VOLUME", "`");
			testEscape("#EsCaPe=`\n", "WORKDIR", "`");
		});
		
		it("#escape =`\\n", function() {
			testEscape("#escape =`\n", "ADD", "`");
			testEscape("#escape =`\n", "ARG", "`");
			testEscape("#escape =`\n", "CMD", "`");
			testEscape("#escape =`\n", "COPY", "`");
			testEscape("#escape =`\n", "ENTRYPOINT", "`");
			testEscape("#escape =`\n", "ENV", "`");
			testEscape("#escape =`\n", "EXPOSE", "`");
			testEscape("#escape =`\n", "FROM", "`");
			testEscape("#escape =`\n", "HEALTHCHECK", "`");
			testEscape("#escape =`\n", "LABEL", "`");
			testEscape("#escape =`\n", "MAINTAINER", "`");
			testEscape("#escape =`\n", "ONBUILD", "`");
			testEscape("#escape =`\n", "RUN", "`");
			testEscape("#escape =`\n", "SHELL", "`");
			testEscape("#escape =`\n", "STOPSIGNAL", "`");
			testEscape("#escape =`\n", "USER", "`");
			testEscape("#escape =`\n", "VOLUME", "`");
			testEscape("#escape =`\n", "WORKDIR", "`");
		});
		
		it("#escape= `\\n", function() {
			testEscape("#escape= `\n", "ADD", "`");
			testEscape("#escape= `\n", "ARG", "`");
			testEscape("#escape= `\n", "CMD", "`");
			testEscape("#escape= `\n", "COPY", "`");
			testEscape("#escape= `\n", "ENTRYPOINT", "`");
			testEscape("#escape= `\n", "ENV", "`");
			testEscape("#escape= `\n", "EXPOSE", "`");
			testEscape("#escape= `\n", "FROM", "`");
			testEscape("#escape= `\n", "HEALTHCHECK", "`");
			testEscape("#escape= `\n", "LABEL", "`");
			testEscape("#escape= `\n", "MAINTAINER", "`");
			testEscape("#escape= `\n", "ONBUILD", "`");
			testEscape("#escape= `\n", "RUN", "`");
			testEscape("#escape= `\n", "SHELL", "`");
			testEscape("#escape= `\n", "STOPSIGNAL", "`");
			testEscape("#escape= `\n", "USER", "`");
			testEscape("#escape= `\n", "VOLUME", "`");
			testEscape("#escape= `\n", "WORKDIR", "`");
		});
		
		it("#escape= ` \\n", function() {
			testEscape("#escape= ` \n", "ADD", "`");
			testEscape("#escape= ` \n", "ARG", "`");
			testEscape("#escape= ` \n", "CMD", "`");
			testEscape("#escape= ` \n", "COPY", "`");
			testEscape("#escape= ` \n", "ENTRYPOINT", "`");
			testEscape("#escape= ` \n", "ENV", "`");
			testEscape("#escape= ` \n", "EXPOSE", "`");
			testEscape("#escape= ` \n", "FROM", "`");
			testEscape("#escape= ` \n", "HEALTHCHECK", "`");
			testEscape("#escape= ` \n", "LABEL", "`");
			testEscape("#escape= ` \n", "MAINTAINER", "`");
			testEscape("#escape= ` \n", "ONBUILD", "`");
			testEscape("#escape= ` \n", "RUN", "`");
			testEscape("#escape= ` \n", "SHELL", "`");
			testEscape("#escape= ` \n", "STOPSIGNAL", "`");
			testEscape("#escape= ` \n", "USER", "`");
			testEscape("#escape= ` \n", "VOLUME", "`");
			testEscape("#escape= ` \n", "WORKDIR", "`");
		});
		
		it("#esc ape=`\\n", function() {
			testEscape("#esc ape=`\n", "ADD", "\\");
			testEscape("#esc ape=`\n", "ARG", "\\");
			testEscape("#esc ape=`\n", "CMD", "\\");
			testEscape("#esc ape=`\n", "COPY", "\\");
			testEscape("#esc ape=`\n", "ENTRYPOINT", "\\");
			testEscape("#esc ape=`\n", "ENV", "\\");
			testEscape("#esc ape=`\n", "EXPOSE", "\\");
			testEscape("#esc ape=`\n", "FROM", "\\");
			testEscape("#esc ape=`\n", "HEALTHCHECK", "\\");
			testEscape("#esc ape=`\n", "LABEL", "\\");
			testEscape("#esc ape=`\n", "MAINTAINER", "\\");
			testEscape("#esc ape=`\n", "ONBUILD", "\\");
			testEscape("#esc ape=`\n", "RUN", "\\");
			testEscape("#esc ape=`\n", "SHELL", "\\");
			testEscape("#esc ape=`\n", "STOPSIGNAL", "\\");
			testEscape("#esc ape=`\n", "USER", "\\");
			testEscape("#esc ape=`\n", "VOLUME", "\\");
			testEscape("#esc ape=`\n", "WORKDIR", "\\");
		});
		
		it("#escape=``\\n", function() {
			testEscape("#escape=``\n", "ADD", "\\");
			testEscape("#escape=``\n", "ARG", "\\");
			testEscape("#escape=``\n", "CMD", "\\");
			testEscape("#escape=``\n", "COPY", "\\");
			testEscape("#escape=``\n", "ENTRYPOINT", "\\");
			testEscape("#escape=``\n", "ENV", "\\");
			testEscape("#escape=``\n", "EXPOSE", "\\");
			testEscape("#escape=``\n", "FROM", "\\");
			testEscape("#escape=``\n", "HEALTHCHECK", "\\");
			testEscape("#escape=``\n", "LABEL", "\\");
			testEscape("#escape=``\n", "MAINTAINER", "\\");
			testEscape("#escape=``\n", "ONBUILD", "\\");
			testEscape("#escape=``\n", "RUN", "\\");
			testEscape("#escape=``\n", "SHELL", "\\");
			testEscape("#escape=``\n", "STOPSIGNAL", "\\");
			testEscape("#escape=``\n", "USER", "\\");
			testEscape("#escape=``\n", "VOLUME", "\\");
			testEscape("#escape=``\n", "WORKDIR", "\\");
		});
		
		it("# This is a comment\\n#escape=`\\n", function() {
			testEscape("# This is a comment\n#escape=`\n", "ADD", "\\");
			testEscape("# This is a comment\n#escape=`\n", "ARG", "\\");
			testEscape("# This is a comment\n#escape=`\n", "CMD", "\\");
			testEscape("# This is a comment\n#escape=`\n", "COPY", "\\");
			testEscape("# This is a comment\n#escape=`\n", "ENTRYPOINT", "\\");
			testEscape("# This is a comment\n#escape=`\n", "ENV", "\\");
			testEscape("# This is a comment\n#escape=`\n", "EXPOSE", "\\");
			testEscape("# This is a comment\n#escape=`\n", "FROM", "\\");
			testEscape("# This is a comment\n#escape=`\n", "HEALTHCHECK", "\\");
			testEscape("# This is a comment\n#escape=`\n", "LABEL", "\\");
			testEscape("# This is a comment\n#escape=`\n", "MAINTAINER", "\\");
			testEscape("# This is a comment\n#escape=`\n", "ONBUILD", "\\");
			testEscape("# This is a comment\n#escape=`\n", "RUN", "\\");
			testEscape("# This is a comment\n#escape=`\n", "SHELL", "\\");
			testEscape("# This is a comment\n#escape=`\n", "STOPSIGNAL", "\\");
			testEscape("# This is a comment\n#escape=`\n", "USER", "\\");
			testEscape("# This is a comment\n#escape=`\n", "VOLUME", "\\");
			testEscape("# This is a comment\n#escape=`\n", "WORKDIR", "\\");
		});
		
		it("#escape=`\\r\\n", function() {
			testEscape("#escape=`\r\n", "ADD", "`");
			testEscape("#escape=`\r\n", "ARG", "`");
			testEscape("#escape=`\r\n", "CMD", "`");
			testEscape("#escape=`\r\n", "COPY", "`");
			testEscape("#escape=`\r\n", "ENTRYPOINT", "`");
			testEscape("#escape=`\r\n", "ENV", "`");
			testEscape("#escape=`\r\n", "EXPOSE", "`");
			testEscape("#escape=`\r\n", "FROM", "`");
			testEscape("#escape=`\r\n", "HEALTHCHECK", "`");
			testEscape("#escape=`\r\n", "LABEL", "`");
			testEscape("#escape=`\r\n", "MAINTAINER", "`");
			testEscape("#escape=`\r\n", "ONBUILD", "`");
			testEscape("#escape=`\r\n", "RUN", "`");
			testEscape("#escape=`\r\n", "SHELL", "`");
			testEscape("#escape=`\r\n", "STOPSIGNAL", "`");
			testEscape("#escape=`\r\n", "USER", "`");
			testEscape("#escape=`\r\n", "VOLUME", "`");
			testEscape("#escape=`\r\n", "WORKDIR", "`");
		});
		
		it("#escape =`\\r\\n", function() {
			testEscape("#escape =`\r\n", "ADD", "`");
			testEscape("#escape =`\r\n", "ARG", "`");
			testEscape("#escape =`\r\n", "CMD", "`");
			testEscape("#escape =`\r\n", "COPY", "`");
			testEscape("#escape =`\r\n", "ENTRYPOINT", "`");
			testEscape("#escape =`\r\n", "ENV", "`");
			testEscape("#escape =`\r\n", "EXPOSE", "`");
			testEscape("#escape =`\r\n", "FROM", "`");
			testEscape("#escape =`\r\n", "HEALTHCHECK", "`");
			testEscape("#escape =`\r\n", "LABEL", "`");
			testEscape("#escape =`\r\n", "MAINTAINER", "`");
			testEscape("#escape =`\r\n", "ONBUILD", "`");
			testEscape("#escape =`\r\n", "RUN", "`");
			testEscape("#escape =`\r\n", "SHELL", "`");
			testEscape("#escape =`\r\n", "STOPSIGNAL", "`");
			testEscape("#escape =`\r\n", "USER", "`");
			testEscape("#escape =`\r\n", "VOLUME", "`");
			testEscape("#escape =`\r\n", "WORKDIR", "`");
		});
		
		it("#escape= `\\r\\n", function() {
			testEscape("#escape= `\r\n", "ADD", "`");
			testEscape("#escape= `\r\n", "ARG", "`");
			testEscape("#escape= `\r\n", "CMD", "`");
			testEscape("#escape= `\r\n", "COPY", "`");
			testEscape("#escape= `\r\n", "ENTRYPOINT", "`");
			testEscape("#escape= `\r\n", "ENV", "`");
			testEscape("#escape= `\r\n", "EXPOSE", "`");
			testEscape("#escape= `\r\n", "FROM", "`");
			testEscape("#escape= `\r\n", "HEALTHCHECK", "`");
			testEscape("#escape= `\r\n", "LABEL", "`");
			testEscape("#escape= `\r\n", "MAINTAINER", "`");
			testEscape("#escape= `\r\n", "ONBUILD", "`");
			testEscape("#escape= `\r\n", "RUN", "`");
			testEscape("#escape= `\r\n", "SHELL", "`");
			testEscape("#escape= `\r\n", "STOPSIGNAL", "`");
			testEscape("#escape= `\r\n", "USER", "`");
			testEscape("#escape= `\r\n", "VOLUME", "`");
			testEscape("#escape= `\r\n", "WORKDIR", "`");
		});
		
		it("#escape= ` \\r\\n", function() {
			testEscape("#escape= ` \r\n", "ADD", "`");
			testEscape("#escape= ` \r\n", "ARG", "`");
			testEscape("#escape= ` \r\n", "CMD", "`");
			testEscape("#escape= ` \r\n", "COPY", "`");
			testEscape("#escape= ` \r\n", "ENTRYPOINT", "`");
			testEscape("#escape= ` \r\n", "ENV", "`");
			testEscape("#escape= ` \r\n", "EXPOSE", "`");
			testEscape("#escape= ` \r\n", "FROM", "`");
			testEscape("#escape= ` \r\n", "HEALTHCHECK", "`");
			testEscape("#escape= ` \r\n", "LABEL", "`");
			testEscape("#escape= ` \r\n", "MAINTAINER", "`");
			testEscape("#escape= ` \r\n", "ONBUILD", "`");
			testEscape("#escape= ` \r\n", "RUN", "`");
			testEscape("#escape= ` \r\n", "SHELL", "`");
			testEscape("#escape= ` \r\n", "STOPSIGNAL", "`");
			testEscape("#escape= ` \r\n", "USER", "`");
			testEscape("#escape= ` \r\n", "VOLUME", "`");
			testEscape("#escape= ` \r\n", "WORKDIR", "`");
		});
		
		it("#esc ape=`\\r\\n", function() {
			testEscape("#esc ape=`\r\n", "ADD", "\\");
			testEscape("#esc ape=`\r\n", "ARG", "\\");
			testEscape("#esc ape=`\r\n", "CMD", "\\");
			testEscape("#esc ape=`\r\n", "COPY", "\\");
			testEscape("#esc ape=`\r\n", "ENTRYPOINT", "\\");
			testEscape("#esc ape=`\r\n", "ENV", "\\");
			testEscape("#esc ape=`\r\n", "EXPOSE", "\\");
			testEscape("#esc ape=`\r\n", "FROM", "\\");
			testEscape("#esc ape=`\r\n", "HEALTHCHECK", "\\");
			testEscape("#esc ape=`\r\n", "LABEL", "\\");
			testEscape("#esc ape=`\r\n", "MAINTAINER", "\\");
			testEscape("#esc ape=`\r\n", "ONBUILD", "\\");
			testEscape("#esc ape=`\r\n", "RUN", "\\");
			testEscape("#esc ape=`\r\n", "SHELL", "\\");
			testEscape("#esc ape=`\r\n", "STOPSIGNAL", "\\");
			testEscape("#esc ape=`\r\n", "USER", "\\");
			testEscape("#esc ape=`\r\n", "VOLUME", "\\");
			testEscape("#esc ape=`\r\n", "WORKDIR", "\\");
		});
		
		it("#escape=``\\r\\n", function() {
			testEscape("#escape=``\r\n", "ADD", "\\");
			testEscape("#escape=``\r\n", "ARG", "\\");
			testEscape("#escape=``\r\n", "CMD", "\\");
			testEscape("#escape=``\r\n", "COPY", "\\");
			testEscape("#escape=``\r\n", "ENTRYPOINT", "\\");
			testEscape("#escape=``\r\n", "ENV", "\\");
			testEscape("#escape=``\r\n", "EXPOSE", "\\");
			testEscape("#escape=``\r\n", "FROM", "\\");
			testEscape("#escape=``\r\n", "HEALTHCHECK", "\\");
			testEscape("#escape=``\r\n", "LABEL", "\\");
			testEscape("#escape=``\r\n", "MAINTAINER", "\\");
			testEscape("#escape=``\r\n", "ONBUILD", "\\");
			testEscape("#escape=``\r\n", "RUN", "\\");
			testEscape("#escape=``\r\n", "SHELL", "\\");
			testEscape("#escape=``\r\n", "STOPSIGNAL", "\\");
			testEscape("#escape=``\r\n", "USER", "\\");
			testEscape("#escape=``\r\n", "VOLUME", "\\");
			testEscape("#escape=``\r\n", "WORKDIR", "\\");
		});
		
		it("# This is a comment\\r\\n#escape=`\\r\\n", function() {
			testEscape("# This is a comment\r\n#escape=`\r\n", "ADD", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "ARG", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "CMD", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "COPY", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "ENTRYPOINT", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "ENV", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "EXPOSE", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "FROM", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "HEALTHCHECK", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "LABEL", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "MAINTAINER", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "ONBUILD", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "RUN", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "SHELL", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "STOPSIGNAL", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "USER", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "VOLUME", "\\");
			testEscape("# This is a comment\r\n#escape=`\r\n", "WORKDIR", "\\");
		});

		it("#\\n", function() {
			testEscape("#\n", "ADD", "\\");
			testEscape("#\n", "ARG", "\\");
			testEscape("#\n", "CMD", "\\");
			testEscape("#\n", "COPY", "\\");
			testEscape("#\n", "ENTRYPOINT", "\\");
			testEscape("#\n", "ENV", "\\");
			testEscape("#\n", "EXPOSE", "\\");
			testEscape("#\n", "FROM", "\\");
			testEscape("#\n", "HEALTHCHECK", "\\");
			testEscape("#\n", "LABEL", "\\");
			testEscape("#\n", "MAINTAINER", "\\");
			testEscape("#\n", "ONBUILD", "\\");
			testEscape("#\n", "RUN", "\\");
			testEscape("#\n", "SHELL", "\\");
			testEscape("#\n", "STOPSIGNAL", "\\");
			testEscape("#\n", "USER", "\\");
			testEscape("#\n", "VOLUME", "\\");
			testEscape("#\n", "WORKDIR", "\\");
		});

		it("#\\r\\n", function() {
			testEscape("#\r\n", "ADD", "\\");
			testEscape("#\r\n", "ARG", "\\");
			testEscape("#\r\n", "CMD", "\\");
			testEscape("#\r\n", "COPY", "\\");
			testEscape("#\r\n", "ENTRYPOINT", "\\");
			testEscape("#\r\n", "ENV", "\\");
			testEscape("#\r\n", "EXPOSE", "\\");
			testEscape("#\r\n", "FROM", "\\");
			testEscape("#\r\n", "HEALTHCHECK", "\\");
			testEscape("#\r\n", "LABEL", "\\");
			testEscape("#\r\n", "MAINTAINER", "\\");
			testEscape("#\r\n", "ONBUILD", "\\");
			testEscape("#\r\n", "RUN", "\\");
			testEscape("#\r\n", "SHELL", "\\");
			testEscape("#\r\n", "STOPSIGNAL", "\\");
			testEscape("#\r\n", "USER", "\\");
			testEscape("#\r\n", "VOLUME", "\\");
			testEscape("#\r\n", "WORKDIR", "\\");
		});

		it("#\\nescape=`", function() {
			testEscape("#\nescape=`", "ADD", "\\");
			testEscape("#\nescape=`", "ARG", "\\");
			testEscape("#\nescape=`", "CMD", "\\");
			testEscape("#\nescape=`", "COPY", "\\");
			testEscape("#\nescape=`", "ENTRYPOINT", "\\");
			testEscape("#\nescape=`", "ENV", "\\");
			testEscape("#\nescape=`", "EXPOSE", "\\");
			testEscape("#\nescape=`", "FROM", "\\");
			testEscape("#\nescape=`", "HEALTHCHECK", "\\");
			testEscape("#\nescape=`", "LABEL", "\\");
			testEscape("#\nescape=`", "MAINTAINER", "\\");
			testEscape("#\nescape=`", "ONBUILD", "\\");
			testEscape("#\nescape=`", "RUN", "\\");
			testEscape("#\nescape=`", "SHELL", "\\");
			testEscape("#\nescape=`", "STOPSIGNAL", "\\");
			testEscape("#\nescape=`", "USER", "\\");
			testEscape("#\nescape=`", "VOLUME", "\\");
			testEscape("#\nescape=`", "WORKDIR", "\\");
		});

		it("#\\r\\nescape=`", function() {
			testEscape("#\r\nescape=`", "ADD", "\\");
			testEscape("#\r\nescape=`", "ARG", "\\");
			testEscape("#\r\nescape=`", "CMD", "\\");
			testEscape("#\r\nescape=`", "COPY", "\\");
			testEscape("#\r\nescape=`", "ENTRYPOINT", "\\");
			testEscape("#\r\nescape=`", "ENV", "\\");
			testEscape("#\r\nescape=`", "EXPOSE", "\\");
			testEscape("#\r\nescape=`", "FROM", "\\");
			testEscape("#\r\nescape=`", "HEALTHCHECK", "\\");
			testEscape("#\r\nescape=`", "LABEL", "\\");
			testEscape("#\r\nescape=`", "MAINTAINER", "\\");
			testEscape("#\r\nescape=`", "ONBUILD", "\\");
			testEscape("#\r\nescape=`", "RUN", "\\");
			testEscape("#\r\nescape=`", "SHELL", "\\");
			testEscape("#\r\nescape=`", "STOPSIGNAL", "\\");
			testEscape("#\r\nescape=`", "USER", "\\");
			testEscape("#\r\nescape=`", "VOLUME", "\\");
			testEscape("#\r\nescape=`", "WORKDIR", "\\");
		});

		it("#escape=x", function() {
			var content = "#escape=x\nFROM x\n";
			var proposals = compute(content, content.length);
			assertAllProposals(proposals, 2, 0, 0);
		});
	});
});
