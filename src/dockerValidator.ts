/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	TextDocument, Position, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { Dockerfile } from '../parser/dockerfile';
import { Instruction } from '../parser/instruction';
import { DockerfileParser } from '../parser/dockerfileParser';
import { Util, DIRECTIVE_ESCAPE } from './docker';
import { ValidatorSettings } from './dockerValidatorSettings';

export enum ValidationCode {
	LOWERCASE,
	ARGUMENT_MISSING,
	ARGUMENT_EXTRA,
	ARGUMENT_REQUIRES_ONE_OR_THREE,
	NO_SOURCE_IMAGE,
	INVALID_ESCAPE_DIRECTIVE,
	INVALID_AS,
	INVALID_PORT,
	INVALID_SIGNAL,
	UNKNOWN_DIRECTIVE,
	UNKNOWN_INSTRUCTION,
	DEPRECATED_MAINTAINER
}

export enum ValidationSeverity {
	IGNORE,
	WARNING,
	ERROR
}

export const ValidatorSettingsDefaults: ValidatorSettings = {
	deprecatedMaintainer: ValidationSeverity.WARNING
}

export class Validator {

	private document: TextDocument;

	private settings: ValidatorSettings;

	constructor(settings?: ValidatorSettings) {
		if (!settings) {
			settings = ValidatorSettingsDefaults;
		}
		this.settings = settings;
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
			problems.push(Validator.createUnknownDirective(range.start, range.end, directiveName));
		} else {
			// if the directive's value is invalid or isn't the empty string, flag it
			if (value !== '\\' && value !== '`' && value !== "") {
				let range = directive.getValueRange();
				problems.push(Validator.createInvalidEscapeDirective(range.start, range.end, value));
			}
		}

		return {
			escape: value === '\\' || value === '`' ? value : '\\',
			dc: document.offsetAt(directive.getRange().end)
		};
	}

	/**
	 * Checks the arguments of the given instruction.
	 * 
	 * @param document the document being validated
	 * @param instruction the instruction to validate
	 * @param problems an array of identified problems in the document
	 * @param expectedArgCount an array of expected number of arguments
	 *                         for the instruction, if its length is 1
	 *                         and its value is -1, any number of
	 *                         arguments greater than zero is valid
	 * @param validate the function to use to validate an argument
	 * @param createIncompleteDiagnostic the function to use to create a diagnostic
	 *                                   if the number of arguments is incorrect
	 */
	private checkArguments(document: TextDocument, instruction: Instruction, problems: Diagnostic[], expectedArgCount: number[],
			validate: Function, createIncompleteDiagnostic?: Function): void {
		let args = instruction.getArguments();
		if (args.length === 0) {
			// all instructions are expected to have at least one argument
			let range = instruction.getInstructionRange();
			problems.push(Validator.createMissingArgument(range.start, range.end));
		} else if (expectedArgCount[0] === -1) {
			for (let i = 0; i < args.length; i++) {
				let createInvalidDiagnostic = validate(i, args[i].getValue());
				if (createInvalidDiagnostic) {
					let range = args[i].getRange();
					problems.push(createInvalidDiagnostic(range.start, range.end, args[i].getValue()));
				}
			}
		} else {
			for (let i = 0; i < expectedArgCount.length; i++) {
				if (expectedArgCount[i] === args.length) {
					for (let j = 0; j < args.length; j++) {
						let createInvalidDiagnostic = validate(j, args[j].getValue());
						if (createInvalidDiagnostic) {
							let range = args[j].getRange();
							problems.push(createInvalidDiagnostic(range.start, range.end, args[i].getValue()));
						}
					}
					return;
				}
			}

			let extra = false;
			for (let i = 0; i < expectedArgCount.length; i++) {
				extra = expectedArgCount[i] < args.length || extra;
			}

			if (extra) {
				let range = args[args.length - 1].getRange();
				if (createIncompleteDiagnostic) {
					problems.push(createIncompleteDiagnostic(range.start, range.end));
				} else {
					problems.push(Validator.createExtraArgument(range.start, range.end));
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
			problems.push(Validator.createNoSourceImage(document.positionAt(0), document.positionAt(0)));
		} else if (instructions.length !== 0 && instructions[0].getKeyword() !== "FROM") {
			// first instruction is not a FROM
			let range = instructions[0].getInstructionRange();
			problems.push(Validator.createNoSourceImage(range.start, range.end));
		}
		for (let instruction of dockerfile.getInstructions()) {
			let keyword = instruction.getKeyword();
			if (keywords.indexOf(keyword) === -1) {
				let range = instruction.getInstructionRange();
				// invalid instruction found
				problems.push(Validator.createUnknownInstruction(range.start, range.end, keyword));
			} else if (keyword !== instruction.getInstruction()) {
				let range = instruction.getInstructionRange();
				// warn about uppercase convention if the keyword doesn't match the actual instruction
				problems.push(Validator.createUppercaseInstruction(range.start, range.end));
			} else {
				if (keyword === "MAINTAINER") {
					let range = instruction.getInstructionRange();
					let diagnostic = this.createMaintainerDeprecated(range.start, range.end);
					if (diagnostic) {
						problems.push(diagnostic);
					}
				}

				switch (keyword) {
					case "WORKDIR":
					case "USER":
						this.checkArguments(document, instruction, problems, [ 1 ], function(index, argument) {
							return null;
						});
						break;
					case "FROM":
						this.checkArguments(document, instruction, problems, [ 1, 3 ], function(index, argument) {
							if (index === 1) {
								return argument.toUpperCase() === "AS" ? null : Validator.createInvalidAs;
							}
							return null;
						}, Validator.createRequiresOneOrThreeArguments);
						break;
					case "STOPSIGNAL":
						this.checkArguments(document, instruction, problems, [ 1 ], function(index, argument) {
							if (argument.indexOf("SIG") === 0) {
								return null;
							}
							
							for (var i = 0; i < argument.length; i++) {
								if ('0' > argument.charAt(i) || '9' < argument.charAt(i)) {
									return Validator.createInvalidStopSignal;
								}
							}
							return null;
						});
						break;
					case "EXPOSE":
						this.checkArguments(document, instruction, problems, [ -1 ], function(index, argument) {
							for (var i = 0; i < argument.length; i++) {
								if (argument.charAt(i) !== '-' && ('0' > argument.charAt(i) || '9' < argument.charAt(i))) {
									return Validator.createInvalidPort;
								}
							}

							return argument.charAt(0) !== '-' && argument.charAt(argument.length - 1) !== '-' ? null : Validator.createInvalidPort;
						});
						break;
					default:
						this.checkArguments(document, instruction, problems, [ -1 ], function(index, argument) {
							return null;
						});
						break;
				}
			}
		}

		return problems;
	}

	private static dockerProblems = {
		"directiveUnknown": "Unknown directive: ${0}",
		"directiveEscapeInvalid": "invalid ESCAPE '${0}'. Must be ` or \\",

		"noSourceImage": "No source image provided with `FROM`",

		"fromRequiresOneOrThreeArguments": "FROM requires either one or three arguments",

		"invalidAs": "Second argument should be AS",
		"invalidPort": "Invalid containerPort: ${0}",
		"invalidStopSignal": "Invalid signal: ${0}",

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

	public static getDiagnosticMessage_InvalidAs() {
		return Validator.dockerProblems["invalidAs"];
	}

	public static getDiagnosticMessage_InvalidPort(port: string) {
		return Validator.formatMessage(Validator.dockerProblems["invalidPort"], port);
	}

	public static getDiagnosticMessage_InvalidSignal(signal: string) {
		return Validator.formatMessage(Validator.dockerProblems["invalidStopSignal"], signal);
	}

	public static getDiagnosticMessage_InstructionExtraArgument() {
		return Validator.dockerProblems["instructionExtraArgument"];
	}

	public static getDiagnosticMessage_InstructionMissingArgument() {
		return Validator.dockerProblems["instructionMissingArgument"];
	}

	public static getDiagnosticMessage_InstructionRequiresOneOrThreeArguments() {
		return Validator.dockerProblems["fromRequiresOneOrThreeArguments"];
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

	static createUnknownDirective(start: Position, end: Position, directive: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_DirectiveUnknown(directive), ValidationCode.UNKNOWN_DIRECTIVE);
	}

	static createInvalidEscapeDirective(start: Position, end: Position, value: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_DirectiveEscapeInvalid(value), ValidationCode.INVALID_ESCAPE_DIRECTIVE);
	}

	static createInvalidAs(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InvalidAs(), ValidationCode.INVALID_AS);
	}

	static createInvalidPort(start: Position, end: Position, port: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InvalidPort(port), ValidationCode.INVALID_PORT);
	}

	static createInvalidStopSignal(start: Position, end: Position, signal: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InvalidSignal(signal), ValidationCode.INVALID_SIGNAL);
	}

	static createMissingArgument(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionMissingArgument(), ValidationCode.ARGUMENT_MISSING);
	}

	static createExtraArgument(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionExtraArgument(), ValidationCode.ARGUMENT_EXTRA);
	}

	static createRequiresOneOrThreeArguments(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionRequiresOneOrThreeArguments(), ValidationCode.ARGUMENT_REQUIRES_ONE_OR_THREE);
	}

	static createNoSourceImage(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_NoSourceImage(), ValidationCode.NO_SOURCE_IMAGE);
	}

	static createUnknownInstruction(start: Position, end: Position, instruction: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionUnknown(instruction), ValidationCode.UNKNOWN_INSTRUCTION);
	}

	static createError(start: Position, end: Position, description: string, code?: ValidationCode): Diagnostic {
		return Validator.createDiagnostic(DiagnosticSeverity.Error, start, end, description, code);
	}

	static createUppercaseInstruction(start: Position, end: Position): Diagnostic {
		return Validator.createWarning(start, end, Validator.getDiagnosticMessage_InstructionCasing(), ValidationCode.LOWERCASE);
	}

	createMaintainerDeprecated(start: Position, end: Position): Diagnostic {
		let severity = null;
		if (this.settings.deprecatedMaintainer === ValidationSeverity.ERROR) {
			severity = DiagnosticSeverity.Error;
		} else if (this.settings.deprecatedMaintainer === ValidationSeverity.WARNING) {
			severity = DiagnosticSeverity.Warning;
		}

		if (severity) {
			return Validator.createDiagnostic(severity, start, end, Validator.getDiagnosticMessage_DeprecatedMaintainer(), ValidationCode.DEPRECATED_MAINTAINER);
		}
		return null;
	}

	static createWarning(start: Position, end: Position, description: string, code?: ValidationCode): Diagnostic {
		return Validator.createDiagnostic(DiagnosticSeverity.Warning, start, end, description, code);
	}

	static createDiagnostic(severity: DiagnosticSeverity, start: Position, end: Position, description: string, code?: ValidationCode): Diagnostic {
		return {
			range: {
				start: start,
				end: end
			},
			message: description,
			severity: severity,
			code: code,
			source: "dockerfile-lsp"
		};
	}
}