/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	TextDocument, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { Dockerfile } from '../parser/dockerfile';
import { Instruction } from '../parser/instruction';
import { DockerfileParser } from '../parser/dockerfileParser';
import { Util, DIRECTIVE_ESCAPE } from './docker';
import { ValidatorSettings } from './dockerValidatorSettings';

export enum ValidationCode {
	DEFAULT,
	LOWERCASE,
	EXTRA_ARGUMENT,
	NO_SOURCE_IMAGE,
	MISSING_ARGUMENT,
	INVALID_ESCAPE_DIRECTIVE,
	INVALID_PORT,
	INVALID_STOPSIGNAL,
	UNKNOWN_DIRECTIVE,
	UNKNOWN_INSTRUCTION,
	DEPRECATED_MAINTAINER
}

export enum ValidationSeverity {
	IGNORE,
	WARNING,
	ERROR
}

export class Validator {

	private document: TextDocument;

	private settings: ValidatorSettings = {
		deprecatedMaintainer: ValidationSeverity.WARNING
	};

	constructor(settings?: ValidatorSettings) {
		if (settings) {
			this.settings = settings;
		}
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
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let parsed = this.parseDirective(dockerfile, document, problems);
		let escape = parsed.escape;
		let firstInstruction = false;
		let dc = parsed.dc;
		let instructions = dockerfile.getInstructions();
		if (instructions.length === 0) {
			// no instructions in this file
			problems.push(this.createNoSourceImage(0, 0));
		} else if (instructions.length !== 0 && instructions[0].getKeyword() !== "FROM") {
			// first instruction is not a FROM
			let range = instructions[0].getInstructionRange();
			problems.push(this.createNoSourceImage(document.offsetAt(range.start), document.offsetAt(range.end)));
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
				if (keyword === "MAINTAINER") {
					let range = instruction.getInstructionRange();
					let diagnostic = this.createMaintainerDeprecated(document.offsetAt(range.start), document.offsetAt(range.start));
					if (diagnostic) {
						problems.push(diagnostic);
					}
				}

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

		return problems;
	}

	private static dockerProblems = {
		"directiveUnknown": "Unknown directive: ${0}",
		"directiveEscapeInvalid": "invalid ESCAPE '${0}'. Must be ` or \\",

		"noSourceImage": "No source image provided with `FROM`",

		"invalidPort": "Invalid containerPort: ${0}",
		"invalidStopSignal": "Invalid stop signal",

		"instructionExtraArgument": "Instruction has an extra argument",
		"instructionMissingArgument": "Instruction has no arguments",
		"instructionUnknown": "Unknown instruction: ${0}",
		"instructionCasing": "Instructions should be written in uppercase letters",

		"deprecatedMaintainer": "MAINTAINER has been deprecated",
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

	public static getDiagnosticMessage_NoSourceImage() {
		return Validator.dockerProblems["noSourceImage"];
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

	createNoSourceImage(start: number, end: number): Diagnostic {
		return this.createError(start, end, Validator.getDiagnosticMessage_NoSourceImage(), ValidationCode.NO_SOURCE_IMAGE);
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
		let severity = null;
		if (this.settings.deprecatedMaintainer === ValidationSeverity.ERROR) {
			severity = DiagnosticSeverity.Error;
		} else if (this.settings.deprecatedMaintainer === ValidationSeverity.WARNING) {
			severity = DiagnosticSeverity.Warning;
		}

		if (severity) {
			return this.createDiagnostic(severity, start, end, Validator.getDiagnosticMessage_DeprecatedMaintainer(), ValidationCode.DEPRECATED_MAINTAINER);
		}
		return null;
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