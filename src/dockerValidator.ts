/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { Util, DIRECTIVE_ESCAPE } from './docker';

export enum ValidationCode {
	DEFAULT,
	LOWERCASE,
	EXTRA_ARGUMENT,
	INVALID_ESCAPE_DIRECTIVE,
	INVALID_PORT,
	INVALID_STOPSIGNAL
}

export class Validator {

	private document: TextDocument;

	shouldSkipNewline(text: string, offset: number, escape: string) {
		// only skip ahead if at an escape character,
		// the next character is a newline, and not at the end of the file
		return text.charAt(offset) === escape && offset !== text.length - 1 && (text.charAt(offset + 1) === '\r' || text.charAt(offset + 1) === '\n');
	}

	parseDirective(text: string, problems: Diagnostic[]) {
		var hasFrom = false;
		var inComment = false;
		var directiveEnd = -1;
		var directiveMark = -1;
		var escapeCharacter = '\\';
		var dc = 0;
		directiveCheck: for (dc = 0; dc < text.length; dc++) {
			switch (text.charAt(dc)) {
				case '#':
					// first line is a comment, might be a directive
					inComment = true;
					break;
				case ' ':
				case '\t':
					// ignore whitespace
					continue;
				case '\r':
				case '\n':
					// newlines, stop processing directive
					dc++;
					break directiveCheck;
				case '=':
					// are we processing a potentially valid directive declaration
					if (inComment && directiveMark !== -1) {
						var directiveName = text.substring(directiveMark, directiveEnd + 1);
						if (directiveName.toLowerCase() !== DIRECTIVE_ESCAPE) {
							// Dockerfiles currently only support the 'escape' directive
							problems.push(this.createUnknownDirective(directiveMark, directiveEnd + 1, directiveName));
							// process the rest of this line before letting the standard parser work
							while (true) {
								dc++;
								if (dc === text.length || text.charAt(dc) === '\r' || text.charAt(dc) === '\n') {
									// end of file or newline
									break directiveCheck;
								}
							}
						}

						directiveMark = -1;
						while (true) {
							dc++;
							if (dc === text.length) {
								// end of file
								var value = text.substring(directiveMark, dc).trim();
								if (value === '`' || value === '\\') {
									escapeCharacter = value;
								} else {
									// the defined escape directive was not a single character
									problems.push(this.createInvalidEscapeDirective(directiveMark, directiveMark + value.length, value));
								}
								break directiveCheck;
							}

							switch (text.charAt(dc)) {
								case '\r':
								case '\n':
									if (directiveMark !== -1) {
										value = text.substring(directiveMark, dc).trim();
										if (value === '`' || value === '\\') {
											escapeCharacter = value;
										} else {
											problems.push(this.createInvalidEscapeDirective(directiveMark, directiveMark + value.length, value));
										}
									}
									dc++;
									break directiveCheck;
								default:
									if (directiveMark === -1) {
										directiveMark = dc;
									}
									break;
							}
						}
					}
					break directiveCheck;
				default:
					if (inComment) {
						// flag the first non-whitespace character as the name of the directive
						if (directiveMark === -1) {
							directiveMark = dc;
						}
						directiveEnd = dc;
						break;
					}
					break directiveCheck;
			}
		}

		return {
			escape: escapeCharacter,
			dc: dc
		}
	}

	validate(keywords: string[], document: TextDocument): Diagnostic[] {
		this.document = document;
		let text = document.getText();
		let problems: Diagnostic[] = [];
		let hasFrom = false;
		let parsed = this.parseDirective(text, problems);
		let escape = parsed.escape;
		let firstInstruction = false;
		let dc = parsed.dc;

		lineCheck: for (let i = dc; i < text.length; i++) {
			// skip generic whitespace
			if (Util.isWhitespace(text.charAt(i))) {
				continue;
			}

			if (text.charAt(i) === '#') {
				// skip comments
				for (let j = i + 1; j < text.length; j++) {
					if (text.charAt(j) === '\r' || text.charAt(j) === '\n') {
						i = j;
						break;
					}
				}

				if (j === text.length) {
					// a comment was the last line of the file, we're done
					break;
				}
				continue;
			}

			var instruction = "";
			var start = i;
			var last = -1;
			for (var j = i + 1; j < text.length; j++) {
				if (this.shouldSkipNewline(text, j, escape)) {
					instruction = instruction + text.substring(start, j);
					j++;
					if (text.charAt(j) === '\r' && text.charAt(j + 1) === '\n') {
						j++;
					}
					if (j === text.length - 1) {
						this.markFinalLine(keywords, escape, text, i, last + 1, instruction, instruction.toUpperCase(), problems, hasFrom);
						return problems;
					}
					start = j + 1;
					continue;
				}

				if (Util.isWhitespace(text.charAt(j)) || j === text.length - 1) {
					// first word of the line
					if (j === text.length - 1 && !Util.isWhitespace(text.charAt(j))) {
						// if parsing is at the end and the last character is not a whitespace,
						// then extend the instruction to include the last character
						instruction = instruction + text.substring(start, j + 1);
					} else {
						instruction = instruction + text.substring(start, j);
					}

					var uppercaseInstruction = instruction.toUpperCase();
					if (j === text.length - 1) {
						if (Util.isWhitespace(text.charAt(j))) {
							this.markFinalLine(keywords, escape, text, i, last + 1, instruction, uppercaseInstruction, problems, hasFrom);
						} else {
							this.markFinalLine(keywords, escape, text, i, j, instruction, uppercaseInstruction, problems, hasFrom);
						}
						return problems;
					}

					if (!firstInstruction) {
						firstInstruction = true;
						if (uppercaseInstruction !== "FROM") {
							problems.push(this.createFROMNotFirst(i, j));
							// don't need to flag about a missing FROM, as the user
							// has already been told that the first instruction must be a FROM
							hasFrom = true;
						}
					}

					var unknown = false;
					var jump = -1;
					switch (uppercaseInstruction) {
						case "EXPOSE":
							jump = this.parseEXPOSE(escape, i, j, text, problems);
							break;
						case "FROM":
							hasFrom = true;
							jump = this.parseSingleArgumentNoChecks(escape, i, j, text, problems);
							break;
						case "MAINTAINER":
							jump = this.parseMAINTAINER(escape, i, j, text, problems);
							break;
						case "STOPSIGNAL":
							jump = this.parseSTOPSIGNAL(escape, i, j, text, problems);
							break;
						case "USER":
							jump = this.parseSingleArgumentNoChecks(escape, i, j, text, problems);
							break;
						case "VOLUME":
							jump = this.parseVOLUME(escape, i, j, text, problems);
							break;
						case "WORKDIR":
							jump = this.parseSingleArgumentNoChecks(escape, i, j, text, problems);
							break;
						default:
							if (keywords.indexOf(uppercaseInstruction) === -1) {
								// invalid instruction found
								problems.push(this.createUnknownInstruction(i, j, uppercaseInstruction));
								unknown = true;

								for (var k = j + 1; k < text.length; k++) {
									if (this.shouldSkipNewline(text, k, escape)) {
										k++;
										continue;
									}

									if (text.charAt(k) === '\r' || text.charAt(k) === '\n') {
										// adjust offset and go to the next line
										i = k;
										continue lineCheck;
									} else if (k === text.length - 1) {
										// end of the file
										return problems;
									}
								}
							} else {
								if (instruction !== uppercaseInstruction) {
									// warn about uppercase convention
									problems.push(this.createUppercaseInstruction(i, j));
								}
								var check = false;
								for (var k = j + 1; k < text.length; k++) {
									if (this.shouldSkipNewline(text, k, escape)) {
										k++;
										if (text.charAt(k) === '\r' && text.charAt(k + 1) === '\n') {
											k++;
										}
										continue;
									} else if (text.charAt(k) === '\r' || text.charAt(k) === '\n') {
										if (!check) {
											problems.push(this.createMissingArgument(i, j));
										}
										i = k;
										continue lineCheck;
									} else if (text.charAt(k) !== ' ' && text.charAt(k) !== '\t') {
										check = true;
									}
								}
								// only possible to get here if we've reached the end of the file
								if (!check) {
									problems.push(this.createMissingArgument(i, j));
								}
								return problems;
							}
							break;
					}
					if (instruction !== uppercaseInstruction && !unknown) {
						// warn about uppercase convention if not an unknown instruction
						problems.push(this.createUppercaseInstruction(i, j));
					}

					i = jump;
					continue lineCheck;
				} else {
					last = j;
				}
			}
		}

		if (!hasFrom) {
			problems.push(this.createMissingFrom());
		}

		return problems;
	}

	markFinalLine(keywords, escape, text, i, j, instruction, uppercaseInstruction, problems, hasFrom) {
		if (!Util.isWhitespace(text.charAt(j)) && text.charAt(j) !== escape) {
			j = j + 1;
		}

		if (keywords.indexOf(uppercaseInstruction) === -1) {
			problems.push(this.createUnknownInstruction(i, j, uppercaseInstruction));
		} else {
			problems.push(this.createMissingArgument(i, j));
			if (instruction !== uppercaseInstruction) {
				problems.push(this.createUppercaseInstruction(i, j));
			}
		}

		if (!hasFrom && uppercaseInstruction !== "FROM") {
			problems.push(this.createMissingFrom());
		}
	}

	parseEXPOSE(escape, lineStart, offset, text, problems) {
		return this.parseDisjointArguments(escape, lineStart, offset, text, problems, function(string) {
			for (var i = 0; i < string.length; i++) {
				if (string.charAt(i) !== '-' && ('0' > string.charAt(i) || '9' < string.charAt(i))) {
					return false;
				}
			}

			return string.charAt(0) !== '-' && string.charAt(string.length - 1) !== '-';
		}, this.createInvalidPort.bind(this));
	}

	parseDisjointArguments(escape, lineStart, offset, text, problems, isValid: Function, invalidFunction: Function) {
		var wordStart = -1;
		var wordEnd = -1;
		var flagged = false;
		var valid = false;
		var word = "";
		for (var i = offset + 1; i < text.length; i++) {
			if (this.shouldSkipNewline(text, i, escape)) {
				i++;
				if (text.charAt(i) === '\r' && text.charAt(i + 1) === '\n') {
					i++;
				}
				continue;
			}

			if (text.charAt(i) === ' ' || text.charAt(i) === '\t') {
				if (!flagged && wordStart !== -1) {
					valid = isValid(word);
					if (!valid) {
						problems.push(invalidFunction(wordStart, wordEnd + 1, word));
						flagged = true;
					}
				}
				word = "";
				wordStart = -1;
			} else if (text.charAt(i) === '\r' || text.charAt(i) === '\n') {
				if (!flagged) {
					if (wordStart === -1) {
						if (!valid) {
							// nothing found at all
							problems.push(this.createMissingArgument(lineStart, offset));
						}
					} else if (!isValid(word)) {
						problems.push(invalidFunction(wordStart, i, word));
					}
				}

				// have the parser jump to the next line
				return i;
			} else {
				if (wordStart === -1) {
					wordStart = i;
					wordEnd = i;
				} else {
					wordEnd = i;
				}
				word = word + text.charAt(i);
			}

			if (i === text.length - 1) {
				// reached end of the file
				if (!flagged) {
					if (wordStart === i || !Util.isWhitespace(text.charAt(i))) {
						// increase the index to include the last character if not whitespace
						i++;
					}
					if (wordStart === -1) {
						if (!valid) {
							// nothing found at all
							problems.push(this.createMissingArgument(lineStart, offset));
						}
					} else if (!isValid(word)) {
						problems.push(invalidFunction(wordStart, i, word));
					}
				}
				// reached end of the file have the parser skip ahead
				return i;
			}
		}

		// reached end of the file
		if (!flagged) {
			if (wordStart === i || !Util.isWhitespace(text.charAt(i))) {
				// increase the index to include the last character if not whitespace
				i++;
			}
			if (wordStart === -1) {
				if (!valid) {
					// nothing found at all
					problems.push(this.createMissingArgument(lineStart, offset));
				}
			} else if (!isValid(word)) {
				problems.push(invalidFunction(wordStart, i, word));
			}
		}
		return i;
	}

	parseMAINTAINER(escape, lineStart: number, offset: number, text, problems: Diagnostic[]): number {
		problems.push(this.createMaintainerDeprecated(lineStart, offset));
		for (let i = offset; i < text.length; i++) {
			if (this.shouldSkipNewline(text, i, escape)) {
				i++;
				if (text.charAt(i) === '\r' && text.charAt(i + 1) === '\n') {
					i++;
				}
				continue;
			}
			
			if (text.charAt(i) === '\r' || text.charAt(i) === '\n') {
				return i;
			}
		}
		return text.length;
	}

	parseSTOPSIGNAL(escape: string, lineStart: number, offset: number, text: string, problems: Diagnostic[]): number {
		return this.parseSingleArgument(escape, lineStart, offset, text, problems, function(string) {
			if (string.indexOf("SIG") === 0) {
				return true;
			}
			
			for (var i = 0; i < string.length; i++) {
				if ('0' > string.charAt(i) || '9' < string.charAt(i)) {
					return false;
				}
			}
			return true;
		}, this.createInvalidStopSignal.bind(this));
	}

	parseVOLUME(escape: string, lineStart: number, offset: number, text: string, problems: Diagnostic[]): number {
		var json = true;
		for (let i = offset + 1; i < text.length; i++) {
			if (this.shouldSkipNewline(text, i, escape)) {
				i++;
				if (text.charAt(i) === '\r' && text.charAt(i + 1) === '\n') {
					i++;
				}
				continue;
			}

			if (text.charAt(i) === '\r' || text.charAt(i) === '\n') {
				return i;
			} else if (text.charAt(i) === '[' && json) {
				return this.parseJSON(escape, i, text, problems);
			} else if (text.charAt(i) !== ' ' && text.charAt(i) !== '\t') {
				json = false;
			}
		}
		return text.length;
	}

	parseJSON(escape: string, offset: number, text: string, problems: Diagnostic[]) {
		var inString = false;
		var end = false;
		var last = -1;
		var expectComma = false;
		var flagged = false;
		for (var i = offset + 1; i < text.length; i++) {
			// only handle escapes if we're not inside a JSON string
			if (!inString && this.shouldSkipNewline(text, i, escape)) {
				i++;
				if (text.charAt(i) === '\r' && text.charAt(i + 1) === '\n') {
					i++;
				}
				continue;
			}

			switch (text.charAt(i)) {
				case '"':
					if (expectComma && !flagged) {
						problems.push(this.createUnexpectedToken(i, i + 1));
						return i;
					}
					inString = !inString;
					last = i;

					expectComma = !inString;
					break;
				case ' ':
				case '\t':
					// ignore whitespace
					break;
				case ']':
					if (!inString) {
						end = true;
					}
					last = i;
					break;
				case '\r':
				case '\n':
					if (!end && !flagged) {
						problems.push(this.createUnexpectedToken(last, last + 1));
					}
					return i;
				case ',':
					if (expectComma) {
						expectComma = false;
					}
					last = i;
					break;
				default:
					last = i;
					if (!inString && !flagged) {
						problems.push(this.createUnexpectedToken(last, last + 1));
						flagged = true;
					}
					break;
			}
		}

		if (!flagged) {
			if (inString || !end) {
				problems.push(this.createUnexpectedToken(last, last + 1));
			}
		}
		return last + 1;
	}

	parseSingleArgumentNoChecks(escape: string, lineStart: number, offset: number, text: string, problems: Diagnostic[]) {
		return this.parseSingleArgument(escape, lineStart, offset, text, problems, function() {
			return true;
		}, function() {
			return true;
		});
	}

	parseSingleArgument(escape: string, lineStart: number, offset: number, text: string, problems: Diagnostic[], isValid: Function, invalidFunction: Function) {
		var wordStart = -1;
		var flagged = false;
		var valid = false;
		var word = "";
		for (var i = offset + 1; i < text.length; i++) {
			if (this.shouldSkipNewline(text, i, escape)) {
				i++;
				if (text.charAt(i) === '\r' && text.charAt(i + 1) === '\n') {
					i++;
				}
				continue;
			}

			if (text.charAt(i) === ' ' || text.charAt(i) === '\t') {
				if (!flagged && wordStart !== -1) {
					if (valid) {
						// a second argument has been parsed
						problems.push(this.createExtraArgument(wordStart, i));
						flagged = true;
					} else {
						valid = isValid(word);
						if (!valid) {
							problems.push(invalidFunction(wordStart, i));
							flagged = true;
						}
					}
				}
				wordStart = -1;
			} else if (text.charAt(i) === '\r' || text.charAt(i) === '\n') {
				if (!flagged) {
					if (valid) {
						if (wordStart !== -1) {
							// a second argument has been parsed
							problems.push(this.createExtraArgument(wordStart, i));
						}
					} else if (wordStart === -1) {
						// nothing found at all
						problems.push(this.createMissingArgument(lineStart, offset));
					} else if (!isValid(word)) {
						problems.push(invalidFunction(wordStart, i));
					}
				}
				// have the parser jump to the next line
				return i;
			} else {
				if (wordStart === -1) {
					wordStart = i;
				}
				word = word + text.charAt(i);
			}

			if (i === text.length - 1) {
				// reached end of the file
				if (!flagged) {
					if (wordStart === i || !Util.isWhitespace(text.charAt(i))) {
						i++;
					}

					if (valid) {
						if (wordStart !== -1) {
							// a second argument has been parsed
							problems.push(this.createExtraArgument(wordStart, i));
						}
					} else if (wordStart === -1) {
						// nothing found at all
						problems.push(this.createMissingArgument(lineStart, offset));
					} else if (!isValid(word)) {
						problems.push(invalidFunction(wordStart, i));
					}
				}
				// reached end of the file have the parser skip ahead
				return i;
			}
		}

		if (!flagged) {
			if (wordStart === i || !Util.isWhitespace(text.charAt(i))) {
				i++;
			}

			if (valid) {
				if (wordStart !== -1) {
					// a second argument has been parsed
					problems.push(this.createExtraArgument(wordStart, i));
				}
			} else if (wordStart === -1) {
				// nothing found at all
				problems.push(this.createMissingArgument(lineStart, offset));
			} else if (!isValid(word)) {
				problems.push(invalidFunction(wordStart, i));
			}
		}
		return i;
	}

	private static dockerProblems = {
		"directiveUnknown": "Unknown directive: ${0}",
		"directiveEscapeInvalid": "invalid ESCAPE '${0}'. Must be ` or \\",

		"missingFROM": "FROM instruction not found",
		"firstNotFROM": "First instruction must be FROM",

		"invalidPort": "Invalid containerPort: ${0}",
		"invalidStopSignal": "Invalid stop signal",

		"instructionExtraArgument": "Instruction has an extra argument",
		"instructionMissingArgument": "Instruction has no arguments",
		"instructionUnknown": "Unknown instruction: ${0}",
		"instructionCasing": "Instructions should be written in uppercase letters",

		"deprecatedMaintainer": "MAINTAINER has been deprecated",

		"unexpectedToken": "Unexpected token"
	};
	
	private static formatMessage(text: string, variable: string): string {
		return text.replace("${0}", variable);
	}

	public static getDiagnosticMessage_DirectiveUnknown(directive: string) {
		return Validator.formatMessage(Validator.dockerProblems["directiveUnknown"], directive);
	}

	public static getDiagnosticMessage_DirectiveEscapeInvalid(value: string) {
		return Validator.formatMessage(Validator.dockerProblems["directiveEscapeInvalid"], value);
	}

	public static getDiagnosticMessage_MissingFROM() {
		return Validator.dockerProblems["missingFROM"];
	}

	public static getDiagnosticMessage_FirstNotFROM() {
		return Validator.dockerProblems["firstNotFROM"];
	}

	public static getDiagnosticMessage_InvalidPort(port: string) {
		return Validator.formatMessage(Validator.dockerProblems["invalidPort"], port);
	}

	public static getDiagnosticMessage_InvalidStopsignal() {
		return Validator.dockerProblems["invalidStopsignal"];
	}

	public static getDiagnosticMessage_InstructionExtraArgument() {
		return Validator.dockerProblems["instructionExtraArgument"];
	}

	public static getDiagnosticMessage_InstructionMissingArgument() {
		return Validator.dockerProblems["instructionMissingArgument"];
	}

	public static getDiagnosticMessage_InstructionUnknown(instruction: string) {
		return Validator.formatMessage(Validator.dockerProblems["instructionUnknown"], instruction);
	}

	public static getDiagnosticMessage_InstructionCasing() {
		return Validator.dockerProblems["instructionCasing"];
	}

	public static getDiagnosticMessage_DeprecatedMaintainer() {
		return Validator.dockerProblems["deprecatedMaintainer"];
	}

	public static getDiagnosticMessage_UnexpectedToken() {
		return Validator.dockerProblems["unexpectedToken"];
	}

	createMissingFrom(): Diagnostic {
		return this.createError(0, 0, Validator.getDiagnosticMessage_MissingFROM());
	}

	createUnknownDirective(start: number, end: number, directive: string): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_DirectiveUnknown(directive));
	}

	createInvalidEscapeDirective(start: number, end: number, value: string): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_DirectiveEscapeInvalid(value), ValidationCode.INVALID_ESCAPE_DIRECTIVE);
	}

	createInvalidPort(start: number, end: number, port: string): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_InvalidPort(port), ValidationCode.INVALID_PORT);
	}

	createInvalidStopSignal(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_InvalidStopsignal(), ValidationCode.INVALID_STOPSIGNAL);
	}

	createMissingArgument(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_InstructionMissingArgument());
	}

	createExtraArgument(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_InstructionExtraArgument(), ValidationCode.EXTRA_ARGUMENT);
	}

	createUnexpectedToken(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_UnexpectedToken());
	}

	createFROMNotFirst(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_FirstNotFROM());
	}

	createUnknownInstruction(start: number, end: number, instruction: string): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_InstructionUnknown(instruction));
	}

	createError(start: number, end: number, description: string, code?: ValidationCode): Diagnostic {
		return this.createDiagnostic(DiagnosticSeverity.Error, start, end, description, code);
	}

	createUppercaseInstruction(start: number, end: number): Diagnostic {
		return this.createWarning(start, end, Validator.getDiagnosticMessage_InstructionCasing(), ValidationCode.LOWERCASE);
	}

	createMaintainerDeprecated(start: number, end: number): Diagnostic {
		return this.createWarning(start, end, Validator.getDiagnosticMessage_DeprecatedMaintainer());
	}

	createWarning(start: number, end: number, description: string, code?: ValidationCode): Diagnostic {
		return this.createDiagnostic(DiagnosticSeverity.Warning, start, end, description, code);
	}

	createDiagnostic(severity: DiagnosticSeverity, start: number, end: number, description: string, code?: ValidationCode): Diagnostic {
		if (!code) {
			code = ValidationCode.DEFAULT;
		}
		return {
			range: {
				start: this.document.positionAt(start),
				end: this.document.positionAt(end)
			},
			message: description,
			severity: severity,
			code: code,
			source: "dockerfile-lsp"
		};
	}
}