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
import { DockerRegistryClient } from './dockerRegistryClient';
import { DockerfileParser } from './parser/dockerfileParser';
import { Copy } from './parser/instructions/copy';
import { From } from './parser/instructions/from';
import { Healthcheck } from './parser/instructions/healthcheck';
import { Onbuild } from './parser/instructions/onbuild';
import { Instruction } from './parser/instruction';

export class DockerAssist {

	private snippetSupport: boolean;
	private document: TextDocument;

	/**
	 * The client for communicating with a Docker registry.
	 */
	private dockerRegistryClient: DockerRegistryClient;

	/**
	 * Creates a content assist processor for suggesting completion items related to a Dockerfile.
	 * 
	 * @param document the text document to provide suggestions for
	 * @param snippetSupport true if snippets are supported by the client, false otherwise
	 * @param dockerRegistryClient the client for communicating with a Docker registry
	 */
	constructor(document: TextDocument, snippetSupport: boolean, dockerRegistryClient: DockerRegistryClient) {
		this.document = document;
		this.snippetSupport = snippetSupport;
		this.dockerRegistryClient = dockerRegistryClient;
	}

	public computeProposals(document: TextDocument, position: Position): CompletionItem[] | PromiseLike<CompletionItem[]> {
		let buffer = document.getText();
		let offset = document.offsetAt(position);
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let escapeCharacter = dockerfile.getEscapeCharacter();

		let directive = dockerfile.getDirective();
		if (directive !== null && position.line === 0) {
			let range = directive.getNameRange();
			if (position.character <= range.start.character) {
				// in whitespace before the directive's name
				return [ this.createEscape(0, offset, DIRECTIVE_ESCAPE) ];
			} else if (position.character <= range.end.character) {
				// in the name
				return [ this.createEscape(position.character - range.start.character, offset, DIRECTIVE_ESCAPE) ];
			}
			return [];
		}

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
							return [ this.createEscape(0, offset, DIRECTIVE_ESCAPE) ];
						}
						let comment = comments[0].getContent();
						if (position.character <= range.end.character) {
							// within the content
							let prefix = comment.substring(0, position.character - range.start.character);
							// substring check
							if (DIRECTIVE_ESCAPE.indexOf(prefix.toLowerCase()) === 0) {
								return [ this.createEscape(prefix.length, offset, DIRECTIVE_ESCAPE) ];
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
						for (let variable of dockerfile.getVariableNames(position.line)) {
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
						for (let variable of dockerfile.getVariableNames(position.line)) {
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
						return this.createCopyProposals(dockerfile, instruction as Copy, position, offset, prefix);
					case "FROM":
						return this.createFromProposals(instruction as From, position, prefix);
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
							if (trigger !== null) {
								switch (trigger.getKeyword()) {
									case "COPY":
										return this.createCopyProposals(dockerfile, trigger as Copy, position, offset, prefix);
									case "HEALTHCHECK":
										let subcommand = (trigger as Healthcheck).getSubcommand();
										if (subcommand && subcommand.isBefore(position)) {
											return [];
										}
										return this.createHealthcheckProposals(dockerfile, position, offset, prefix);
								}
							}
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
				return [ this.createFROM(0, offset, "FROM") ];
			}
			// no prefix, return all the proposals
			return this.createProposals(KEYWORDS, previousWord, 0, offset);
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

		return this.createProposals(suggestions, previousWord, prefix.length, offset);
	}

	createProposals(keywords: string[], previousWord: string, prefixLength: number, offset: number): CompletionItem[] {
		let proposals: CompletionItem[] = [];
		for (var i = 0; i < keywords.length; i++) {
			switch (keywords[i]) {
				case "ARG":
					if (this.snippetSupport) {
						proposals.push(this.createARG_NameOnly(prefixLength, offset));
						proposals.push(this.createARG_DefaultValue(prefixLength, offset));
					} else {
						proposals.push(this.createARG(prefixLength, offset));
					}
					break;
				case "HEALTHCHECK":
					proposals.push(this.createHEALTHCHECK_CMD(prefixLength, offset));
					proposals.push(this.createHEALTHCHECK_NONE(prefixLength, offset));
					break;
				case "FROM":
				case "MAINTAINER":
				case "ONBUILD":
					// can't have FROM, MAINTAINER, or ONBUILD follow an ONBUILD
					if (previousWord) {
						break;
					}
				default:
					proposals.push(this.createSingleProposals(keywords[i], prefixLength, offset));
					break;
			}
		}
		return proposals;
	}

	private createCopyProposals(dockerfile: Dockerfile, copy: Copy, position: Position, offset: number, prefix: string) {
		let range = copy.getFromValueRange();
		// is the user in the --from= area
		if (range && Util.isInsideRange(position, copy.getFromValueRange())) {
			const names: { [key: string]: boolean; } = {};
			const items: CompletionItem[] = [];
			let stageIndex = 0;
			// determines if the last build stage was named or not
			let lastNumber = false;
			// get the prefix
			let stagePrefix = this.document.getText().substring(this.document.offsetAt(range.start), offset).toLowerCase();
			for (let from of dockerfile.getFROMs()) {
				if (copy.isAfter(from)) {
					const image = from.getImage();
					let stage = from.getBuildStage();
					if (stage) {
						const lowercase = stage.toLowerCase();
						if (lowercase.indexOf(stagePrefix) === 0 && !names[lowercase]) {
							names[lowercase] = true;
							items.push(this.createSourceImageCompletionItem(stage, image, stageIndex, stagePrefix.length, offset));
						}
						lastNumber = false;
					} else if (!names[stageIndex]) {
						names[stageIndex] = true;
						items.push(this.createSourceImageCompletionItem(stageIndex.toString(), image, stageIndex, stagePrefix.length, offset));
						lastNumber = true;
					}
					stageIndex++;
				} else {
					break;
				}
			}

			// last build stage was not named, don't suggest it as it is recursive
			if (lastNumber && items.length > 0) {
				items.pop();
			}
			return items;
		}

		const flags = copy.getFlags();
		let copyArgs = copy.getArguments();
		if (copyArgs.length === 0 && copy.getFlags().length === 0) {
			return [ this.createCOPY_FlagFrom(0, offset) ];
		} else if ((copyArgs.length > 0 && Util.isInsideRange(position, copyArgs[0].getRange()) && "--from=".indexOf(prefix) === 0)
				|| (flags.length > 0 && "--from=".indexOf(flags[0].toString()) === 0)) {
			return [ this.createCOPY_FlagFrom(prefix.length, offset) ];
		}

		return [];
	}

	private createFromProposals(from: From, position: Position, prefix: string): CompletionItem[] | PromiseLike<CompletionItem[]> {
		// checks if the cursor is in the image's tag area
		if (Util.isInsideRange(position, from.getImageTagRange())) {
			const index = prefix.indexOf(':');
			const lastIndex = prefix.indexOf(':');
			if (index === lastIndex) {
				prefix = prefix.substring(index + 1);
			} else {
				prefix = prefix.substring(index + 1, lastIndex);
			}
			const client = this.dockerRegistryClient;
			return new Promise<CompletionItem[]>(async (resolve, reject) => {
				const items = [];
				const tags = await client.getTags(from.getImageName());
				for (const tag of tags) {
					if (tag.indexOf(prefix) === 0) {
						items.push({
							label: tag,
							kind: CompletionItemKind.Property,
							insertTextFormat: InsertTextFormat.PlainText,
						});
					}
				}
				resolve(items);
			});
		}
		return [];
	}

	private createHealthcheckProposals(dockerfile: Dockerfile, position: Position, offset: number, prefix: string) {
		let items: CompletionItem[] = [];
		if (prefix.length < 3 && "CMD".indexOf(prefix.toUpperCase()) === 0) {
			items.push(this.createHEALTHCHECK_CMD_Subcommand(prefix.length, offset));
		}
		if (prefix.length < 4 && "NONE".indexOf(prefix.toUpperCase()) === 0) {
			items.push(this.createHEALTHCHECK_NONE_Subcommand(prefix.length, offset));
		}
		if ("--interval".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagInterval(prefix.length, offset));
		}
		if ("--retries".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagRetries(prefix.length, offset));
		}
		if ("--start-period".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagStartPeriod(prefix.length, offset));
		}
		if ("--timeout".indexOf(prefix) === 0) {
			items.push(this.createHEALTHCHECK_FlagTimeout(prefix.length, offset));
		}

		for (let i = 0; i < items.length; i++) {
			items[i].sortText = i.toString();
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

	createSingleProposals(keyword: string, prefixLength: number, offset: number): CompletionItem {
		switch (keyword) {
			case "ADD":
				return this.createADD(prefixLength, offset, keyword);
			case "CMD":
				return this.createCMD(prefixLength, offset, keyword);
			case "COPY":
				return this.createCOPY(prefixLength, offset, keyword);
			case "ENTRYPOINT":
				return this.createENTRYPOINT(prefixLength, offset, keyword);
			case "ENV":
				return this.createENV(prefixLength, offset, keyword);
			case "EXPOSE":
				return this.createEXPOSE(prefixLength, offset, keyword);
			case "FROM":
				return this.createFROM(prefixLength, offset, keyword);
			case "LABEL":
				return this.createLABEL(prefixLength, offset, keyword);
			case "MAINTAINER":
				return this.createMAINTAINER(prefixLength, offset, keyword);
			case "ONBUILD":
				return this.createONBUILD(prefixLength, offset, keyword);
			case "RUN":
				return this.createRUN(prefixLength, offset, keyword);
			case "SHELL":
				return this.createSHELL(prefixLength, offset, keyword);
			case "STOPSIGNAL":
				return this.createSTOPSIGNAL(prefixLength, offset, keyword);
			case "WORKDIR":
				return this.createWORKDIR(prefixLength, offset, keyword);
			case "VOLUME":
				return this.createVOLUME(prefixLength, offset, keyword);
			case "USER":
				return this.createUSER(prefixLength, offset, keyword);
		}
		throw new Error("Unknown keyword found: " + keyword);
	}

	createADD(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ADD", "ADD source dest", prefixLength, offset, "ADD ${1:source} ${2:dest}", markdown);
	}

	private createARG(prefixLength: number, offset: number): CompletionItem {
		return this.createKeywordCompletionItem("ARG", "ARG", prefixLength, offset, "ARG", "ARG");
	}

	createARG_NameOnly(prefixLength: number, offset: number): CompletionItem {
		return this.createKeywordCompletionItem("ARG", "ARG name", prefixLength, offset, "ARG ${1:name}", "ARG_NameOnly");
	}

	createARG_DefaultValue(prefixLength: number, offset: number): CompletionItem {
		return this.createKeywordCompletionItem("ARG", "ARG name=defaultValue", prefixLength, offset, "ARG ${1:name}=${2:defaultValue}", "ARG_DefaultValue");
	}

	createCMD(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("CMD", "CMD [ \"executable\" ]", prefixLength, offset, "CMD [ \"${1:executable}\" ]", markdown);
	}

	createCOPY(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("COPY", "COPY source dest", prefixLength, offset, "COPY ${1:source} ${2:dest}", markdown);
	}

	createENTRYPOINT(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ENTRYPOINT", "ENTRYPOINT [ \"executable\" ]", prefixLength, offset, "ENTRYPOINT [ \"${1:executable}\" ]", markdown);
	}

	createENV(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ENV", "ENV key=value", prefixLength, offset, "ENV ${1:key}=${2:value}", markdown);
	}

	createEXPOSE(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("EXPOSE", "EXPOSE port", prefixLength, offset, "EXPOSE ${1:port}", markdown);
	}

	createFROM(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("FROM", "FROM baseImage", prefixLength, offset, "FROM ${1:baseImage}", markdown);
	}

	createHEALTHCHECK_CMD(prefixLength: number, offset: number): CompletionItem {
		if (this.snippetSupport) {
			return this.createKeywordCompletionItem("HEALTHCHECK",
				"HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD [ \"executable\" ]",
				prefixLength,
				offset,
				"HEALTHCHECK --interval=${1:30s} --timeout=${2:30s} --start-period=${3:5s} --retries=${4:3} CMD [ \"${5:executable}\" ]",
				"HEALTHCHECK_CMD");
		}

		let textEdit = this.createTextEdit(prefixLength, offset, "HEALTHCHECK CMD");
		return {
			data: "HEALTHCHECK_CMD",
			textEdit: textEdit,
			label: "HEALTHCHECK CMD",
			kind: CompletionItemKind.Keyword,
			insertTextFormat: InsertTextFormat.PlainText,
		};
	}

	private createHEALTHCHECK_CMD_Subcommand(prefixLength: number, offset: number): CompletionItem {
		if (this.snippetSupport) {
			return this.createKeywordCompletionItem("CMD",
				"CMD [ \"executable\" ]",
				prefixLength,
				offset,
				"CMD [ \"${1:executable}\" ]",
				"HEALTHCHECK_CMD");
		}

		const textEdit = this.createTextEdit(prefixLength, offset, "CMD");
		return {
			data: "HEALTHCHECK_CMD",
			textEdit: textEdit,
			label: "CMD",
			kind: CompletionItemKind.Keyword,
			insertTextFormat: InsertTextFormat.PlainText,
		};
	}

	private createCOPY_FlagFrom(prefixLength: number, offset: number): CompletionItem {
		if (this.snippetSupport) {
			return this.createFlagCompletionItem("--from=stage", prefixLength, offset, "--from=${1:stage}", "COPY_FlagFrom");
		}
		return this.createFlagCompletionItem("--from=", prefixLength, offset, "--from=", "COPY_FlagFrom");
	}

	private createHEALTHCHECK_FlagInterval(prefixLength: number, offset: number): CompletionItem {
		if (this.snippetSupport) {
			return this.createFlagCompletionItem("--interval=30s", prefixLength, offset, "--interval=${1:30s}", "HEALTHCHECK_FlagInterval");
		}
		return this.createFlagCompletionItem("--interval=", prefixLength, offset, "--interval=", "HEALTHCHECK_FlagInterval");
	}

	private createHEALTHCHECK_FlagRetries(prefixLength: number, offset: number): CompletionItem {
		if (this.snippetSupport) {
			return this.createFlagCompletionItem("--retries=3", prefixLength, offset, "--retries=${1:3}", "HEALTHCHECK_FlagInterval");
		}
		return this.createFlagCompletionItem("--retries=", prefixLength, offset, "--retries=", "HEALTHCHECK_FlagInterval");
	}

	private createHEALTHCHECK_FlagStartPeriod(prefixLength: number, offset: number): CompletionItem {
		if (this.snippetSupport) {
			return this.createFlagCompletionItem("--start-period=5s", prefixLength, offset, "--start-period=${1:5s}", "HEALTHCHECK_FlagStartPeriod");
		}
		return this.createFlagCompletionItem("--start-period=", prefixLength, offset, "--start-period=", "HEALTHCHECK_FlagStartPeriod");
	}

	private createHEALTHCHECK_FlagTimeout(prefixLength: number, offset: number): CompletionItem {
		if (this.snippetSupport) {
			return this.createFlagCompletionItem("--timeout=30s", prefixLength, offset, "--timeout=${1:30s}", "HEALTHCHECK_FlagTimeout");
		}
		return this.createFlagCompletionItem("--timeout=", prefixLength, offset, "--timeout=", "HEALTHCHECK_FlagTimeout");
	}

	createHEALTHCHECK_NONE(prefixLength: number, offset: number): CompletionItem {
		return this.createPlainTextCompletionItem("HEALTHCHECK NONE", prefixLength, offset, "HEALTHCHECK NONE", "HEALTHCHECK_NONE");
	}

	private createHEALTHCHECK_NONE_Subcommand(prefixLength: number, offset: number): CompletionItem {
		return this.createPlainTextCompletionItem("NONE", prefixLength, offset, "NONE", "HEALTHCHECK_NONE");
	}

	createLABEL(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("LABEL", "LABEL key=\"value\"", prefixLength, offset, "LABEL ${1:key}=\"${2:value}\"", markdown);
	}

	createMAINTAINER(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("MAINTAINER", "MAINTAINER name", prefixLength, offset, "MAINTAINER ${1:name}", markdown);
	}

	createONBUILD(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("ONBUILD", "ONBUILD INSTRUCTION", prefixLength, offset, "ONBUILD ${1:INSTRUCTION}", markdown);
	}

	createRUN(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("RUN", "RUN command", prefixLength, offset, "RUN ${1:command}", markdown);
	}

	createSHELL(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("SHELL", "SHELL [ \"executable\" ]", prefixLength, offset, "SHELL [ \"${1:executable}\" ]", markdown);
	}

	createSTOPSIGNAL(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("STOPSIGNAL", "STOPSIGNAL signal", prefixLength, offset, "STOPSIGNAL ${1:signal}", markdown);
	}

	createUSER(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("USER", "USER daemon", prefixLength, offset, "USER ${1:daemon}", markdown);
	}

	createVOLUME(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("VOLUME", "VOLUME [ \"/data\" ]", prefixLength, offset, "VOLUME [ \"${1:/data}\" ]", markdown);
	}

	createWORKDIR(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem("WORKDIR", "WORKDIR /the/workdir/path", prefixLength, offset, "WORKDIR ${1:/the/workdir/path}", markdown);
	}

	createEscape(prefixLength: number, offset: number, markdown: string): CompletionItem {
		return this.createKeywordCompletionItem(DIRECTIVE_ESCAPE, "escape=`", prefixLength, offset, "escape=${1:`}", markdown);
	}

	createKeywordCompletionItem(keyword: string, label: string, prefixLength: number, offset: number, insertText: string, markdown: string): CompletionItem {
		if (!this.snippetSupport) {
			// only inserting the keyword so set the label to the keyword
			label = keyword;
			// just insert the keyword if snippets are not supported by the client
			insertText = keyword;
		}

		let textEdit = this.createTextEdit(prefixLength, offset, insertText);
		return {
			data: markdown,
			textEdit: textEdit,
			label: label,
			kind: CompletionItemKind.Keyword,
			insertTextFormat: this.snippetSupport ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
		};
	}

	private createPlainTextCompletionItem(label: string, prefixLength: number, offset: number, insertText: string, markdown: string): CompletionItem {
		let textEdit = this.createTextEdit(prefixLength, offset, insertText);
		return {
			data: markdown,
			textEdit: textEdit,
			label: label,
			kind: CompletionItemKind.Keyword,
			insertTextFormat: InsertTextFormat.PlainText,
		};
	}

	private createFlagCompletionItem(label: string, prefixLength: number, offset: number, insertText: string, markdown: string): CompletionItem {
		let textEdit = this.createTextEdit(prefixLength, offset, insertText);
		return {
			data: markdown,
			textEdit: textEdit,
			label: label,
			kind: CompletionItemKind.Field,
			insertTextFormat: this.snippetSupport ? InsertTextFormat.Snippet : InsertTextFormat.PlainText,
		};
	}

	private createSourceImageCompletionItem(label: string, documentation: string, buildIndex: number, prefixLength: number, offset: number): CompletionItem {
		return {
			textEdit: this.createTextEdit(prefixLength, offset, label),
			label: label,
			documentation: documentation,
			kind: CompletionItemKind.Reference,
			insertTextFormat: InsertTextFormat.PlainText,
			sortText: buildIndex.toString()
		};
	}

	private createVariableCompletionItem(text: string, prefixLength: number, offset: number, brace: boolean, documentation: string): CompletionItem {
		return {
			textEdit: this.createTextEdit(prefixLength, offset, text),
			label: text,
			kind: CompletionItemKind.Variable,
			insertTextFormat: InsertTextFormat.PlainText,
			documentation: documentation
		};
	}

	private createTextEdit(prefixLength: number, offset: number, content: string): TextEdit {
		if (prefixLength === 0) {
			return TextEdit.insert(this.document.positionAt(offset), content);
		}
		return TextEdit.replace(Range.create(this.document.positionAt(offset - prefixLength), this.document.positionAt(offset)), content);
	}
}
