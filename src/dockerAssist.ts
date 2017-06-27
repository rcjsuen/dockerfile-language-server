/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextEdit, Range,
	CompletionItem, CompletionItemKind, InsertTextFormat
} from 'vscode-languageserver';
import { Util, KEYWORDS, DIRECTIVE_ESCAPE } from './docker';

export class DockerAssist {

	dockerMessages = {
		"hoverAdd": "Copy files, folders, or remote URLs from `source` to the `dest` path in the image's filesystem.\n\n",
		"hoverArg": "Define a variable with an optional default value that users can override at build-time when using `docker build`.\n\n",
		"hoverCmd": "Provide defaults for an executing container. If an executable is not specified, then `ENTRYPOINT` must be specified as well. There can only be one `CMD` instruction in a `Dockerfile`.\n\n",
		"hoverCopy": "Copy files or folders from `source` to the `dest` path in the image's filesystem.\n\n",
		"hoverEntrypoint": "Configures the container to be run as an executable.\n\n",
		"hoverEnv": "Set the environment variable `key` to the value `value`.\n\n",
		"hoverExpose": "Define the network `port`s that this container will listen on at runtime.\n\n",
		"hoverFrom": "Set the `baseImage` to use for subsequent instructions. `FROM` must be the first instruction in a `Dockerfile`.\n\n",
		"hoverHealthcheck": "Define how Docker should test the container to check that it is still working. Alternatively, disable the base image's `HEALTHCHECK` instruction. There can only be one `HEALTHCHECK` instruction in a `Dockerfile`.\n\nSince Docker 1.12\n\n",
		"hoverLabel": "Adds metadata to an image.\n\nSince Docker 1.6\n\n",
		"hoverMaintainer": "Set the _Author_ field of the generated images. This instruction has been deprecated in favor of `LABEL`.\n\n",
		"hoverOnbuild": "Add a _trigger_ instruction to the image that will be executed when the image is used as a base image for another build.\n\n",
		"hoverRun": "Execute any commands on top of the current image as a new layer and commit the results.\n\n",
		"hoverShell": "Override the default shell used for the _shell_ form of commands.\n\nSince Docker 1.12\n\n",
		"hoverStopsignal": "Set the system call signal to use to send to the container to exit. Signals can be valid unsigned numbers or a signal name in the `SIGNAME` format such as `SIGKILL`.\n\nSince Docker 1.12\n\n",
		"hoverUser": "Set the user name or UID to use when running the image in addition to any subsequent `CMD`, `ENTRYPOINT`, or `RUN` instructions that follow it in the `Dockerfile`.\n\n",
		"hoverVolume": "Create a mount point with the specifid name and mark it as holding externally mounted volumes from the native host or from other containers.\n\n",
		"hoverWorkdir": "Set the working directory for any subsequent `ADD`, `COPY`, `CMD`, `ENTRYPOINT`, or `RUN` instructions that follow it in the `Dockerfile`.\n\n",
		"hoverOnlineDocumentationFooter": "\n\n[Online documentation](${0})",

		"hoverEscape": "Sets the character to use to escape characters and newlines in this Dockerfile. If unspecified, the default escape character is `\\`.\n\n",

		"proposalArgNameOnly": "Define a variable that users can set at build-time when using `docker build`.\n\n",
		"proposalArgDefaultValue": "Define a variable with the given default value that users can override at build-time when using `docker build`.\n\n",
		"proposalHealthcheckExec": "Define how Docker should test the container to check that it is still working. There can only be one `HEALTHCHECK` instruction in a `Dockerfile`.\n\nSince Docker 1.12\n\n",
		"proposalHealthcheckNone": "Disable the `HEALTHCHECK` instruction inherited from the base image if one exists. There can only be one `HEALTHCHECK` instruction in a `Dockerfile`.\n\nSince Docker 1.12"
	};
	i18nUtil = {
		formatMessage(text: string, variable: string): string {
			return text.replace("${0}", variable);
		}
	};

	private snippetSupport: boolean;
	private document: TextDocument;

	constructor(document: TextDocument, snippetSupport: boolean) {
		this.document = document;
		this.snippetSupport = snippetSupport;
	}

	computeProposals(buffer: string, offset: number): CompletionItem[] {
		var firstCommentIdx = -1;
		var escapeCharacter = "\\";
		directiveCheck: for (var i = 0; i < buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case '#':
					firstCommentIdx = i;
					// in the first comment of the file, look for directives
					var directive = "";
					var capture = false;
					escapeCheck: for (var j = i + 1; j < buffer.length; j++) {
						var char = buffer.charAt(j);
						switch (char) {
							case ' ':
							case '\t':
								// ignore whitespace if directive is well-formed or hasn't been found yet
								if (directive !== DIRECTIVE_ESCAPE && directive !== "") {
									break escapeCheck;
								}
								continue;
							case '=':
								if (directive === DIRECTIVE_ESCAPE) {
									// '=' found and the directive that has been declared is the escape directive,
									// record its value so we know what the escape character of this Dockerfile is
									capture = true;
								} else {
									// unknown directive found, stop searching
									break escapeCheck;
								}
								break;
							default:
								if (capture) {
									// the escape directive should be a single character and followed by whitespace,
									// it should also either be a backslash or a backtick
									if ((j + 1 === buffer.length || Util.isWhitespace(buffer.charAt(j + 1)))
										&& (char === '\\' || char === '`')) {
										escapeCharacter = char;
									}
									break escapeCheck;
								}
								directive = directive + char.toLowerCase();
								break;
						}
					}
					break directiveCheck;
				case ' ':
				case '\t':
					// ignore whitespace
					continue;
				case '\r':
				case '\n':
					break directiveCheck;
				default:
					// not a comment then not a directive
					break directiveCheck;
			}
		}

		let prefix = this.calculateTruePrefix(buffer, offset, escapeCharacter);

		// start from the offset and walk back
		commentCheck: for (i = offset - 1; i >= 0; i--) {
			switch (buffer.charAt(i)) {
				case '#':
					if (i === firstCommentIdx) {
						// we're in the first comment, might need to suggest
						// the escape directive as a proposal
						let leadingString = buffer.substring(i + 1, offset);
						let found = false;
						for (let j = 0; j < leadingString.length; j++) {
							if (leadingString.charAt(j) !== ' ' && leadingString.charAt(j) !== '\\') {
								leadingString = leadingString.substring(j);
								found = true;
								break;
							}
						}

						if (!found) {
							leadingString = "";
						}

						let directivePrefix = leadingString.toLowerCase();
						if (DIRECTIVE_ESCAPE.indexOf(directivePrefix) === 0) {
							return [ this.createEscape(directivePrefix, offset, DIRECTIVE_ESCAPE) ];
						}
					}
					// in a comment, no proposals to suggest
					return [];
				case ' ':
				case '\t':
					// ignore whitespace
					continue;
				case '\r':
				case '\n':
					// walked back to the beginning of this line, not in a comment
					break commentCheck;
			}
		}

		// get every line in the file
		var split = buffer.trim().split("\n");
		var fromOnly = split.some(function (line) {
			var trimmed = line.trim();
			// check if it's a comment or an empty line
			return trimmed.length !== 0 && trimmed.charAt(0) !== '#';
		});
		if (!fromOnly) {
			// if we only have empty lines and comments, only suggest FROM
			return [ this.createFROM(prefix, offset, "FROM") ];
		}

		var previousWord = "";
		var whitespace = false;
		var lineStart = 0;
		lineCheck: for (i = offset - 1; i >= 0; i--) {
			char = buffer.charAt(i);
			switch (char) {
				case '\n':
					if (buffer.charAt(i - 1) === escapeCharacter) {
						i--;
						continue;
					} else if (buffer.charAt(i - 1) === '\r' && buffer.charAt(i - 2) === escapeCharacter) {
						i = i - 2;
						continue;
					}

					if (previousWord !== "" && previousWord !== "ONBUILD") {
						// keyword content assist only allowed after an ONBUILD
						return [];
					}
					lineStart = i + 1;
					break lineCheck;
				case ' ':
				case '\t':
					if (whitespace) {
						if (previousWord !== "" && previousWord !== "ONBUILD") {
							// keyword content assist only allowed after an ONBUILD
							return [];
						}
					} else {
						whitespace = true;
					}
					break;
				default:
					if (whitespace) {
						previousWord = char.toUpperCase() + previousWord;
					}
					break;
			}
		}

		let lineEnd = -1;
		for (i = offset; i < buffer.length; i++) {
			char = buffer.charAt(i);
			if (char === '\r' || char === '\n') {
				lineEnd = i;
				break;
			}
		}

		if (lineEnd === -1) {
			lineEnd = buffer.length;
		}
		let line = buffer.substring(lineStart, lineEnd);

		if (previousWord !== "" && previousWord !== "ONBUILD") {
			// only suggest proposals if at the front or after an ONBUILD
			return [];
		}

		if (prefix === "") {
			// no prefix, return all the proposals
			return this.createProposals(KEYWORDS, previousWord, "", offset);
		}

		var suggestions = [];
		var uppercasePrefix = prefix.toUpperCase();
		for (i = 0; i < KEYWORDS.length; i++) {
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

		if (lineStart + line.indexOf(prefix) + prefix.length === offset) {
			return this.createProposals(suggestions, previousWord, prefix, offset);
		}
		return [];
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

	/**
	 * Walks back in the text buffer to calculate the true prefix of the
	 * current text caret offset. Orion's provided prefix does not include
	 * symbols but we do want to consider that a prefix in Dockerfiles.
	 * 
	 * @param buffer the content of the opened file
	 * @param offset the current text caret's offset
	 * @param escapeCharacter the escape character defined in this Dockerfile
	 */
	calculateTruePrefix(buffer: string, offset: number, escapeCharacter: string): string {
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
			"HEALTHCHECK --interval=30s --timeout=30s --retries=3 CMD [ \"executable\" ]",
			prefix,
			offset,
			"HEALTHCHECK --interval=${1:30s} --timeout=${2:30s} --retries=${3:3} CMD [ \"${4:executable}\" ]",
			"HEALTHCHECK_CMD");
	}

	createHEALTHCHECK_NONE(prefix: string, offset: number): CompletionItem {
		return this.createKeywordCompletionItem("HEALTHCHECK", "HEALTHCHECK NONE", prefix, offset, "HEALTHCHECK NONE", "HEALTHCHECK_NONE");
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

	createTextEdit(prefix: string, offset: number, content: string): TextEdit {
		if (prefix === "") {
			return TextEdit.insert(this.document.positionAt(offset), content);
		}
		return TextEdit.replace(Range.create(this.document.positionAt(offset - prefix.length), this.document.positionAt(offset)), content);
	}
}
