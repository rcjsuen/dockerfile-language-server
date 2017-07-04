/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { Dockerfile } from '../parser/dockerfile';
import { Instruction } from '../parser/instruction';
import { DockerfileParser } from '../parser/dockerfileParser';
import { Util, DIRECTIVE_ESCAPE } from './docker';

export enum ValidationCode {
	DEFAULT,
	LOWERCASE,
	EXTRA_ARGUMENT,
	FROM_NOT_FIRST,
	FROM_MISSING,
	MISSING_ARGUMENT,
	INVALID_ESCAPE_DIRECTIVE,
	INVALID_PORT,
	INVALID_STOPSIGNAL,
	UNKNOWN_DIRECTIVE,
	UNKNOWN_INSTRUCTION
}

export class Validator {

	private document: TextDocument;

	shouldSkipNewline(text: string, offset: number, escape: string) {
		// only skip ahead if at an escape character,
		// the next character is a newline, and not at the end of the file
		return text.charAt(offset) === escape && offset !== text.length - 1 && (text.charAt(offset + 1) === '\r' || text.charAt(offset + 1) === '\n');
	}

	parseDirective(dockerfile: Dockerfile, document: TextDocument, problems: Diagnostic[]) {
		let directive = dockerfile.getDirective();
		if (directive === null) {
			return {
				escape: '\\',
				dc: 0
			}
		}

		let directiveName = directive.getDirective();
		let value = directive.getValue();
		if (directiveName !== DIRECTIVE_ESCAPE) {
			// Dockerfiles currently only support the 'escape' directive
			let range = directive.getNameRange();
			problems.push(this.createUnknownDirective(document.offsetAt(range.start), document.offsetAt(range.end), directiveName));
		} else {
			// if the directive's value is invalid or isn't the empty string, flag it
			if (value !== '\\' && value !== '`' && value !== "") {
				let range = directive.getValueRange();
				problems.push(this.createInvalidEscapeDirective(document.offsetAt(range.start), document.offsetAt(range.end), value));
			}
		}

		return {
			escape: value === '\\' || value === '`' ? value : '\\',
			dc: document.offsetAt(directive.getRange().end)
		};
	}

	checkArguments(document: TextDocument, escapeChar: string, instruction: Instruction, problems: Diagnostic[]): boolean {
		let range = instruction.getInstructionRange();
		let args = instruction.getTextContent().substring(instruction.getInstruction().length);
		let missing = true;
		for (let i = 0; i < args.length; i++) {
			if (Util.isWhitespace(args.charAt(i))) {
				continue;
			} else if (args.charAt(i) === escapeChar) {
				if (args.charAt(i + 1) === '\r' || args.charAt(i + 1) === '\n') {
					i++;
				} else {
					missing = false;
					break;
				}
			} else {
				missing = false;
				break;
			}
		}
		if (missing) {
			problems.push(this.createMissingArgument(document.offsetAt(range.start), document.offsetAt(range.end)));
			return false;
		}
		return true;
	}

	private checkSingleArgument(document: TextDocument, escapeChar: string, instruction: Instruction, problems: Diagnostic[], singleOnly: boolean, validate: Function, createDiagnostic?: Function): void {
		let args = instruction.getArgments(escapeChar);
		if (args.length !== 0) {
			if (singleOnly) {
				if (!validate(args[0].getValue())) {
					let range = args[0].getRange();
					problems.push(createDiagnostic(document.offsetAt(range.start), document.offsetAt(range.end)));
				}

				if (args.length > 1) {
					let range = args[1].getRange();
					problems.push(this.createExtraArgument(document.offsetAt(range.start), document.offsetAt(range.end)));
				}
			} else {
				for (let arg of args) {
					if (!validate(arg.getValue())) {
						let range = arg.getRange();
						problems.push(createDiagnostic(document.offsetAt(range.start), document.offsetAt(range.end), arg.getValue()));
					}
				}
			}
		}
	}

	validate(keywords: string[], document: TextDocument): Diagnostic[] {
		this.document = document;
		let text = document.getText();
		let problems: Diagnostic[] = [];
		let hasFrom = false;
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let parsed = this.parseDirective(dockerfile, document, problems);
		let escape = parsed.escape;
		let firstInstruction = false;
		let dc = parsed.dc;
		let instructions = dockerfile.getInstructions();
		if (instructions.length !== 0 && instructions[0].getKeyword() !== "FROM") {
			let range = instructions[0].getInstructionRange();
			problems.push(this.createFROMNotFirst(document.offsetAt(range.start), document.offsetAt(range.end)));
		}
		for (let instruction of dockerfile.getInstructions()) {
			let keyword = instruction.getKeyword();
			if (keywords.indexOf(keyword) === -1) {
				let range = instruction.getInstructionRange();
				// invalid instruction found
				problems.push(this.createUnknownInstruction(document.offsetAt(range.start), document.offsetAt(range.end), keyword));
			} else if (keyword !== instruction.getInstruction()) {
				let range = instruction.getInstructionRange();
				// warn about uppercase convention if the keyword doesn't match the actual instruction
				problems.push(this.createUppercaseInstruction(document.offsetAt(range.start), document.offsetAt(range.end)));
			} else {
				if (this.checkArguments(document, escape, instruction, problems)) {
					switch (keyword) {
						case "FROM":
						case "WORKDIR":
						case "USER":
							this.checkSingleArgument(document, escape, instruction, problems, true, function(argument) {
								return true;
							});
							break;
						case "STOPSIGNAL":
							this.checkSingleArgument(document, escape, instruction, problems, true, function(argument) {
								if (argument.indexOf("SIG") === 0) {
									return true;
								}
								
								for (var i = 0; i < argument.length; i++) {
									if ('0' > argument.charAt(i) || '9' < argument.charAt(i)) {
										return false;
									}
								}
								return true;
							}, this.createInvalidStopSignal.bind(this));
							break;
						case "EXPOSE":
							this.checkSingleArgument(document, escape, instruction, problems, false, function(argument) {
								for (var i = 0; i < argument.length; i++) {
									if (argument.charAt(i) !== '-' && ('0' > argument.charAt(i) || '9' < argument.charAt(i))) {
										return false;
									}
								}

								return argument.charAt(0) !== '-' && argument.charAt(argument.length - 1) !== '-';
							}, this.createInvalidPort.bind(this));
							break;
					}
				}
			}
		}

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
						continue lineCheck;
					}
				}

				// a comment was the last line of the file, we're done
				break lineCheck;
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
							// don't need to flag about a missing FROM, as the user
							// has already been told that the first instruction must be a FROM
							hasFrom = true;
						}
					}

					var jump = -1;
					switch (uppercaseInstruction) {
						case "MAINTAINER":
							jump = this.parseMAINTAINER(escape, i, j, text, problems);
							break;
						case "FROM":
							hasFrom = true;
						case "EXPOSE":
						case "STOPSIGNAL":
						case "USER":
						case "WORKDIR":
							for (var k = j + 1; k < text.length; k++) {
								if (this.shouldSkipNewline(text, k, escape)) {
									k++;
									continue;
								}

								if (text.charAt(k) === '\r' || text.charAt(k) === '\n') {
									// adjust offset and go to the next line
									i = k;
									continue lineCheck;
								}
							}
							// reached EOF
							break lineCheck;
						case "VOLUME":
							jump = this.parseVOLUME(escape, i, j, text, problems);
							break;
						default:
							if (keywords.indexOf(uppercaseInstruction) === -1) {
								// invalid instruction found
								for (var k = j + 1; k < text.length; k++) {
									if (this.shouldSkipNewline(text, k, escape)) {
										k++;
										continue;
									}

									if (text.charAt(k) === '\r' || text.charAt(k) === '\n') {
										// adjust offset and go to the next line
										i = k;
										continue lineCheck;
									}
								}
								// reached EOF
								return problems;
							} else {
								var check = false;
								for (var k = j + 1; k < text.length; k++) {
									if (this.shouldSkipNewline(text, k, escape)) {
										k++;
										if (text.charAt(k) === '\r' && text.charAt(k + 1) === '\n') {
											k++;
										}
										continue;
									} else if (text.charAt(k) === '\r' || text.charAt(k) === '\n') {
										i = k;
										continue lineCheck;
									} else if (text.charAt(k) !== ' ' && text.charAt(k) !== '\t') {
										check = true;
									}
								}
								// only possible to get here if we've reached the end of the file
								return problems;
							}
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

		if (!hasFrom && uppercaseInstruction !== "FROM") {
			problems.push(this.createMissingFrom());
		}
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
		return this.createError(0, 0, Validator.getDiagnosticMessage_MissingFROM(), ValidationCode.FROM_MISSING);
	}

	createUnknownDirective(start: number, end: number, directive: string): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_DirectiveUnknown(directive), ValidationCode.UNKNOWN_DIRECTIVE);
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
		return this.createError(start, end, Validator.getDiagnosticMessage_InstructionMissingArgument(), ValidationCode.MISSING_ARGUMENT);
	}

	createExtraArgument(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_InstructionExtraArgument(), ValidationCode.EXTRA_ARGUMENT);
	}

	createUnexpectedToken(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_UnexpectedToken());
	}

	createFROMNotFirst(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_FirstNotFROM(), ValidationCode.FROM_NOT_FIRST);
	}

	createUnknownInstruction(start: number, end: number, instruction: string): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_InstructionUnknown(instruction), ValidationCode.UNKNOWN_INSTRUCTION);
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