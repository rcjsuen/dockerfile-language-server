/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextEdit, Range, Position,
	CompletionItem, CompletionItemKind, InsertTextFormat
} from 'vscode-languageserver';
import { Util, KEYWORDS, DIRECTIVE_ESCAPE } from './docker';
import { Dockerfile } from './parser/dockerfile';
import { DockerHover } from './dockerHover';
import { DockerfileParser } from './parser/dockerfileParser';
import { Copy } from './parser/instructions/copy';
import { Healthcheck } from './parser/instructions/healthcheck';
import { Onbuild } from './parser/instructions/onbuild';
import { Instruction } from './parser/instruction';

export class DockerAssist {

	private snippetSupport: boolean;
	private document: TextDocument;

	constructor(document: TextDocument, snippetSupport: boolean) {
		this.document = document;
		this.snippetSupport = snippetSupport;
	}

	computeProposals(document: TextDocument, position: Position): CompletionItem[] {
		let buffer = document.getText();
		let offset = document.offsetAt(position);
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let escapeCharacter = dockerfile.getEscapeCharacter();
		// directive only possible on the first line
		let comments = dockerfile.getComments();
		if (comments.length !== 0) {
			if (position.line === 0) {
				let commentRange = comments[0].getRange();
				// check if the first comment is on the first line
				if (commentRange.start.line === 0) {
					// is the user inside the comment
					if (commentRange.start.character < position.character) {
						let range = comments[0].getContentRange();
						if (range === null || position.character <= range.start.character) {
							// in whitespace
							return [ this.createEscape("", offset, DIRECTIVE_ESCAPE) ];
						}
						let comment = comments[0].getContent();
						if (position.character <= range.end.character) {
							// within the content
							let prefix = comment.substring(0, position.character - range.start.character);
							// substring check
							if (DIRECTIVE_ESCAPE.indexOf(prefix.toLowerCase()) === 0) {
								return [ this.createEscape(prefix, offset, DIRECTIVE_ESCAPE) ];
							}
						}
						return [];
					}
				}
			} else {
				for (let comment of comments) {
					let range = comment.getRange();
					if (range.start.line === position.line) {
						if (range.start.character < position.character && position.character <= range.end.character) {
							// inside a comment
							return [];
						}
					}
				}
			}
		}

		let prefix = DockerAssist.calculateTruePrefix(buffer, offset, escapeCharacter);
		if (prefix !== "") {
			let index = prefix.lastIndexOf('$');
			// $ exists so we're at a variable
			if (index !== -1) {
				// check that the variable $ wasn't escaped
				if (prefix.charAt(index - 1) !== '\\') {
					// get the variable's prefix thus far
					var variablePrefix = prefix.substring(index + 1).toLowerCase();
					let prefixLength = variablePrefix.length + 1;
					if (variablePrefix === "") {
						// empty prefix, return all variables
						let items = [];
						for (let variable of dockerfile.getVariableNames()) {
							let doc = dockerfile.getVariableValue(variable, position.line);
							items.push(this.createVariableCompletionItem("${" + variable + '}', prefixLength, offset, true, doc));
						}
						return items;
					} else {
						let brace = false;
						if (variablePrefix.charAt(0) === '{') {
							brace = true;
							variablePrefix = variablePrefix.substring(1);
						}
						let items = [];
						for (let variable of dockerfile.getVariableNames()) {
							if (variable.toLowerCase().indexOf(variablePrefix) === 0) {
							let doc = dockerfile.getVariableValue(variable, position.line);
								items.push(this.createVariableCompletionItem(brace ? "${" + variable + '}' : '$' + variable, prefixLength, offset, brace, doc));
							}
						}
						return items;
					}
				}
			}
		}
		let previousWord = "";

		instructionsCheck: for (let instruction of dockerfile.getInstructions()) {
			if (Util.isInsideRange(position, instruction.getInstructionRange())) {
				break;
			} else if (Util.isInsideRange(position, instruction.getRange())) {
				switch (instruction.getKeyword()) {
					case "COPY":
						return this.createBuildStageProposals(dockerfile, instruction as Copy, position, offset);
					case "HEALTHCHECK":
						let subcommand = (instruction as Healthcheck).getSubcommand();
						if (subcommand && subcommand.isBefore(position)) {
							return [];
						}
						return this.createHealthcheckProposals(dockerfile, position, offset, prefix);
					case "ONBUILD":
						let onbuildArgs = instruction.getArguments();
						if (onbuildArgs.length === 0 || Util.isInsideRange(position, onbuildArgs[0].getRange())) {
							// no trigger instructions or the cursor is in the trigger instruction
							previousWord = "ONBUILD";
							break instructionsCheck;
						} else {
							let trigger = (instruction as Onbuild).getTriggerInstruction();
							if (trigger === "HEALTHCHECK") {
								if (onbuildArgs.length === 1) {
									// suggest HEALTHCHECK flags
									return this.createHealthcheckProposals(dockerfile, position, offset, prefix);
								}
								for (let i = 1; i < onbuildArgs.length; i++) {
									let arg = onbuildArgs[i].getValue().toUpperCase();
									if (arg === "CMD" || arg === "NONE") {
										return [];
									} else if (Util.isInsideRange(position, onbuildArgs[i].getRange())) {
										return this.createHealthcheckProposals(dockerfile, position, offset, prefix);
									}
								}
							}
						}
						switch (onbuildArgs.length) {
							case 0:
								previousWord = "ONBUILD";
								break instructionsCheck;
							case 1:
								previousWord = "ONBUILD";
								break instructionsCheck;
							default:
								break;
						}
						if (onbuildArgs.length === 0 || Util.isInsideRange(position, onbuildArgs[0].getRange())) {
							previousWord = "ONBUILD";
							break instructionsCheck;
						}
						return [];
					default:
						return [];
				}
			}
		}

		if (prefix === "") {
			if (dockerfile.getInstructions().length === 0) {
				// if we don't have any instructions, only suggest FROM
				return [ this.createFROM(prefix, offset, "FROM") ];
			}
			// no prefix, return all the proposals
			return this.createProposals(KEYWORDS, previousWord, "", offset);
		}

		var suggestions = [];
		var uppercasePrefix = prefix.toUpperCase();
		for (let i = 0; i < KEYWORDS.length; i++) {
			if (KEYWORDS[i] === uppercasePrefix) {
				// prefix is a keyword already, nothing to suggest
				return [];
			} else if (KEYWORDS[i].indexOf(uppercasePrefix) === 0) {
				suggestions.push(KEYWORDS[i]);
			}
		}

		if (suggestions.length === 0) {
			// prefix doesn't match any keywords, nothing to suggest
			return [];
		}

		return this.createProposals(suggestions, previousWord, prefix, offset);
	}

	createProposals(keywords: string[], previousWord: string, prefix: string, offset: number): CompletionItem[] {
		let proposals: CompletionItem[] = [];
		for (var i = 0; i < keywords.length; i++) {
			switch (keywords[i]) {
				case "ARG":
					proposals.push(this.createARG_NameOnly(prefix, offset));
					proposals.push(this.createARG_DefaultValue(prefix, offset));
					break;
				case "HEALTHCHECK":
					proposals.push(this.createHEALTHCHECK_CMD(prefix, offset));
					proposals.push(this.createHEALTHCHECK_NONE(prefix, offset));
					break;
				case "FROM":
				case "MAINTAINER":
				case "ONBUILD":
					// can't have FROM, MAINTAINER, or ONBUILD follow an ONBUILD
					if (previousWord) {
						break;
					}
				default:
					proposals.push(this.createSingleProposals(keywords[i], prefix, offset));
					break;
			}
		}
		return proposals;
	}

	private createBuildStageProposals(dockerfile: Dockerfile, copy: Copy, position: Position, offset: number) {
		let range = copy.getFromValueRange();
		// is the user in the --from= area
		if (range && Util.isInsideRange(position, copy.getFromValueRange())) {
			// get the prefix
			let prefix = this.document.getText().substring(this.document.offsetAt(range.start), offset);
			let items: CompletionItem[] = [];
			for (let from of dockerfile.getFROMs()) {
				let stage = from.getBuildStage();
				if (stage && stage.indexOf(prefix) === 0) {
					items.push(this.createSourceImageCompletionItem(stage, prefix, offset));
				}
			}
			items.sort((item: CompletionItem, item2: CompletionItem) => {
				return item.label.localeCompare(item2.label);
			});
			return items;
		}
		return [];
	}

	private createHealthcheckProposals(dockerfile: Dockerfile, position: Position, offset: number, prefix: string) {
		let items: CompletionItem[] = [];
		if ("--interval".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagInterval(prefix, offset));
		}
		if ("--retries".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagRetries(prefix, offset));
		}
		if ("--start-period".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagStartPeriod(prefix, offset));
		}
		if ("--timeout".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagTimeout(prefix, offset));
		}
		return items;
	}

	/**
	 * Walks back in the text buffer to calculate the true prefix of the
	 * current text caret offset. This function will handle the
	 * Dockerfile escape characters to skip escaped newline characters
	 * where applicable.
	 * 
	 * @param buffer the content of the opened file
	 * @param offset the current text caret's offset
	 * @param escapeCharacter the escape character defined in this Dockerfile
	 */
	private static calculateTruePrefix(buffer: string, offset: number, escapeCharacter: string): string {
		var char = buffer.charAt(offset - 1);
		switch (char) {
			case '\n':
				var escapedPrefix = "";
				for (var i = offset - 1; i >= 0; i--) {
					if (buffer.charAt(i) === '\n') {
						if (buffer.charAt(i - 1) === escapeCharacter) {
							i--;
						} else if (buffer.charAt(i - 1) === '\r' && buffer.charAt(i - 2) === escapeCharacter) {
							i = i - 2;
						} else {
							break;
						}
					} else if (buffer.charAt(i) === ' ' || buffer.charAt(i) === '\t') {
						break;
					} else {
						escapedPrefix = buffer.charAt(i).toUpperCase() + escapedPrefix;
					}
				}

				if (escapedPrefix !== "") {
					return escapedPrefix;
				}
				break;
			case '\r':
			case ' ':
			case '\t':
				break;
			default:
				var truePrefix = char;
				for (let i = offset - 2; i >= 0; i--) {
					char = buffer.charAt(i);
					if (Util.isWhitespace(char)) {
						break;
					} else {
						truePrefix = char + truePrefix;
					}
				}
				return truePrefix;
		}
		return "";
	}

	createSingleProposals(keyword: string, prefix: string, offset: number): CompletionItem {
		switch (keyword) {
			case "ADD":
				return this.createADD(prefix, offset, keyword);
			case "CMD":
				return this.createCMD(prefix, offset, keyword);
			case "COPY":
				return this.createCOPY(prefix, offset, keyword);
			case "ENTRYPOINT":
				return this.createENTRYPOINT(prefix, offset, keyword);
			case "ENV":
				return this.createENV(prefix, offset, keyword);
			case "EXPOSE":
				return this.createEXPOSE(prefix, offset, keyword);
			case "FROM":
				return this.createFROM(prefix, offset, keyword);
			case "LABEL":
				return this.createLABEL(prefix, offset, keyword);
			case "MAINTAINER":
				return this.createMAINTAINER(prefix, offset, keyword);
			case "ONBUILD":
				return this.createONBUILD(prefix, offset, keyword);
			case "RUN":
				return this.createRUN(prefix, offset, keyword);
			case "SHELL":
				return this.createSHELL(prefix, offset, keyword);
			case "STOPSIGNAL":
				return this.createSTOPSIGNAL(prefix, offset, keyword);
			case "WORKDIR":
				return this.createWORKDIR(prefix, offset, keyword);
			case "VOLUME":
				return this.createVOLUME(prefix, offset, keyword);
			case "USER":
				return this.createUSER(prefix, offset, keyword);
		}
		throw new Error("Unknown keyword found: " + keyword);
	}

	createADD(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ADD", "ADD source dest", prefix, offset, "ADD ${1:source} ${2:dest}", markdown);
	}

	createARG_NameOnly(prefix: string, offset: number): CompletionItem {
		return this.createKeywordCompletionItem("ARG", "ARG name", prefix, offset, "ARG ${1:name}", "ARG_NameOnly");
	}

	createARG_DefaultValue(prefix: string, offset: number): CompletionItem {
		return this.createKeywordCompletionItem("ARG", "ARG name=defaultValue", prefix, offset, "ARG ${1:name}=${2:defaultValue}", "ARG_DefaultValue");
	}

	createCMD(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("CMD", "CMD [ \"executable\" ]", prefix, offset, "CMD [ \"${1:executable}\" ]", markdown);
	}

	createCOPY(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("COPY", "COPY source dest", prefix, offset, "COPY ${1:source} ${2:dest}", markdown);
	}

	createENTRYPOINT(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ENTRYPOINT", "ENTRYPOINT [ \"executable\" ]", prefix, offset, "ENTRYPOINT [ \"${1:executable}\" ]", markdown);
	}

	createENV(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ENV", "ENV key=value", prefix, offset, "ENV ${1:key}=${2:value}", markdown);
	}

	createEXPOSE(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("EXPOSE", "EXPOSE port", prefix, offset, "EXPOSE ${1:port}", markdown);
	}

	createFROM(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("FROM", "FROM baseImage", prefix, offset, "FROM ${1:baseImage}", markdown);
	}

	createHEALTHCHECK_CMD(prefix: string, offset: number): CompletionItem {
		return this.createKeywordCompletionItem("HEALTHCHECK",
			"HEALTHCHECK --interval=30s --timeout=30s --start-period=0s --retries=3 CMD [ \"executable\" ]",
			prefix,
			offset,
			"HEALTHCHECK --interval=${1:30s} --timeout=${2:30s} --start-period=${3:0s} --retries=${4:3} CMD [ \"${5:executable}\" ]",
			"HEALTHCHECK_CMD");
	}

	private createHEALTHCHECK_FlagInterval(prefix: string, offset: number): CompletionItem {
		let insertText = this.snippetSupport ? "--interval=${1:30s}" : "--interval=";
		return this.createFlagCompletionItem("--interval=30s", prefix, offset, insertText, "HEALTHCHECK_FlagInterval");
	}

	private createHEALTHCHECK_FlagRetries(prefix: string, offset: number): CompletionItem {
		let insertText = this.snippetSupport ? "--retries=${1:3}" : "--retries=";
		return this.createFlagCompletionItem("--retries=3", prefix, offset, insertText, "HEALTHCHECK_FlagRetries");
	}

	private createHEALTHCHECK_FlagStartPeriod(prefix: string, offset: number): CompletionItem {
		let insertText = this.snippetSupport ? "--start-period=${1:0s}" : "--start-period=";
		return this.createFlagCompletionItem("--start-period=0s", prefix, offset, insertText, "HEALTHCHECK_FlagStartPeriod");
	}

	private createHEALTHCHECK_FlagTimeout(prefix: string, offset: number): CompletionItem {
		let insertText = this.snippetSupport ? "--timeout=${1:30s}" : "--timeout=";
		return this.createFlagCompletionItem("--timeout=30s", prefix, offset, insertText, "HEALTHCHECK_FlagTimeout");
	}

	createHEALTHCHECK_NONE(prefix: string, offset: number): CompletionItem {
		return this.createPlainTextCompletionItem("HEALTHCHECK NONE", prefix, offset, "HEALTHCHECK NONE", "HEALTHCHECK_NONE");
	}

	createLABEL(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("LABEL", "LABEL key=\"value\"", prefix, offset, "LABEL ${1:key}=\"${2:value}\"", markdown);
	}

	createMAINTAINER(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("MAINTAINER", "MAINTAINER name", prefix, offset, "MAINTAINER ${1:name}", markdown);
	}

	createONBUILD(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ONBUILD", "ONBUILD INSTRUCTION", prefix, offset, "ONBUILD ${1:INSTRUCTION}", markdown);
	}

	createRUN(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("RUN", "RUN command", prefix, offset, "RUN ${1:command}", markdown);
	}

	createSHELL(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("SHELL", "SHELL [ \"executable\" ]", prefix, offset, "SHELL [ \"${1:executable}\" ]", markdown);
	}

	createSTOPSIGNAL(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("STOPSIGNAL", "STOPSIGNAL signal", prefix, offset, "STOPSIGNAL ${1:signal}", markdown);
	}

	createUSER(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("USER", "USER daemon", prefix, offset, "USER ${1:daemon}", markdown);
	}

	createVOLUME(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("VOLUME", "VOLUME [ \"/data\" ]", prefix, offset, "VOLUME [ \"${1:/data}\" ]", markdown);
	}

	createWORKDIR(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("WORKDIR", "WORKDIR /path", prefix, offset, "WORKDIR ${1:/path}", markdown);
	}

	createEscape(prefix: string, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem(DIRECTIVE_ESCAPE, "escape=`", prefix, offset, "escape=${1:`}", markdown);
	}

	createKeywordCompletionItem(keyword: string, label: string, prefix: string, offset: number, insertText: string, markdown: string): CompletionItem {
		if (!this.snippetSupport) {
			// just insert the keyword if snippets are not supported by the client
			insertText = keyword;
		}

		let textEdit = this.createTextEdit(prefix, offset, insertText);
		return {
			data: markdown,
			textEdit: textEdit,
			label: label,
			kind: CompletionItemKind.Keyword,
			insertTextFormat: this.snippetSupport ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
		};
	}

	private createPlainTextCompletionItem(label: string, prefix: string, offset: number, insertText: string, markdown: string): CompletionItem {
		let textEdit = this.createTextEdit(prefix, offset, insertText);
		return {
			data: markdown,
			textEdit: textEdit,
			label: label,
			kind: CompletionItemKind.Keyword,
			insertTextFormat: InsertTextFormat.PlainText,
		};
	}

	private createFlagCompletionItem(label: string, prefix: string, offset: number, insertText: string, markdown: string): CompletionItem {
		let textEdit = this.createTextEdit(prefix, offset, insertText);
		return {
			data: markdown,
			textEdit: textEdit,
			label: label,
			kind: CompletionItemKind.Field,
			insertTextFormat: this.snippetSupport ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
		};
	}

	private createSourceImageCompletionItem(label: string, prefix: string, offset: number): CompletionItem {
		return {
			textEdit: this.createTextEdit(prefix, offset, label),
			label: label,
			kind: CompletionItemKind.Reference,
			insertTextFormat: InsertTextFormat.PlainText,
		};
	}

	private createVariableCompletionItem(text: string, prefixLength: number, offset: number, brace: boolean, documentation: string): CompletionItem {
		return {
			textEdit: this.createTextEdit2(prefixLength, offset, text),
			label: text,
			kind: CompletionItemKind.Variable,
			insertTextFormat: InsertTextFormat.PlainText,
			documentation: documentation
		};
	}

	createTextEdit(prefix: string, offset: number, content: string): TextEdit {
		if (prefix === "") {
			return TextEdit.insert(this.document.positionAt(offset), content);
		}
		return TextEdit.replace(Range.create(this.document.positionAt(offset - prefix.length), this.document.positionAt(offset)), content);
	}

	createTextEdit2(prefixLength: number, offset: number, text: string): TextEdit {
		if (prefixLength === 0) {
			return TextEdit.insert(this.document.positionAt(offset), text);
		}
		return TextEdit.replace(Range.create(this.document.positionAt(offset - prefixLength), this.document.positionAt(offset)), text);
	}
}
