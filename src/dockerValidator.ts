/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	TextDocument, Range, Position, Diagnostic, DiagnosticSeverity
} from 'vscode-languageserver';
import { Dockerfile } from './parser/dockerfile';
import { Flag } from './parser/flag';
import { Instruction } from './parser/instruction';
import { Env } from './parser/instructions/env';
import { ModifiableInstruction } from './parser/instructions/modifiableInstruction';
import { DockerfileParser } from './parser/dockerfileParser';
import { DIRECTIVE_ESCAPE } from './docker';
import { ValidatorSettings } from './dockerValidatorSettings';

export enum ValidationCode {
	CASING_INSTRUCTION,
	CASING_DIRECTIVE,
	ARGUMENT_MISSING,
	ARGUMENT_EXTRA,
	ARGUMENT_REQUIRES_ONE,
	ARGUMENT_REQUIRES_TWO,
	ARGUMENT_REQUIRES_ONE_OR_THREE,
	ARGUMENT_UNNECESSARY,
	FLAG_AT_LEAST_ONE,
	FLAG_DUPLICATE,
	NO_SOURCE_IMAGE,
	INVALID_ESCAPE_DIRECTIVE,
	INVALID_AS,
	INVALID_PORT,
	INVALID_SIGNAL,
	INVALID_SYNTAX,
	SYNTAX_MISSING_EQUALS,
	MULTIPLE_INSTRUCTIONS,
	UNKNOWN_INSTRUCTION,
	UNKNOWN_FLAG,
	DEPRECATED_MAINTAINER
}

export enum ValidationSeverity {
	IGNORE,
	WARNING,
	ERROR
}

export const ValidatorSettingsDefaults: ValidatorSettings = {
	deprecatedMaintainer: ValidationSeverity.WARNING,
	directiveCasing: ValidationSeverity.WARNING,
	instructionCasing: ValidationSeverity.WARNING,
	instructionCmdMultiple: ValidationSeverity.WARNING,
	instructionEntrypointMultiple: ValidationSeverity.WARNING,
	instructionHealthcheckMultiple: ValidationSeverity.WARNING
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
			return;
		}

		let directiveName = directive.getDirective();
		let value = directive.getValue();
		if (directiveName === DIRECTIVE_ESCAPE) {
			if (value !== '\\' && value !== '`' && value !== "") {
				// if the directive's value is invalid or isn't the empty string, flag it
				let range = directive.getValueRange();
				problems.push(Validator.createInvalidEscapeDirective(range.start, range.end, value));
			}

			if (directive.getName() !== DIRECTIVE_ESCAPE) {
				let range = directive.getNameRange();
				let diagnostic = this.createLowercaseDirective(range.start, range.end);
				if (diagnostic) {
					problems.push(diagnostic);
				}
			}
		}
	}

	/**
	 * Checks the arguments of the given instruction.
	 * 
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
	private checkArguments(instruction: Instruction, problems: Diagnostic[], expectedArgCount: number[],
			validate: Function, createIncompleteDiagnostic?: Function): void {
		let args = instruction.getArguments();
		if (args.length === 0) {
			// all instructions are expected to have at least one argument
			let range = instruction.getInstructionRange();
			problems.push(Validator.createMissingArgument(range.start, range.end));
		} else if (expectedArgCount[0] === -1) {
			for (let i = 0; i < args.length; i++) {
				let createInvalidDiagnostic = validate(i, args[i].getValue(), args[i].getRange());
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

			let range = args[args.length - 1].getRange();
			if (createIncompleteDiagnostic) {
				problems.push(createIncompleteDiagnostic(range.start, range.end));
			} else {
				problems.push(Validator.createExtraArgument(range.start, range.end));
			}
		}
	}

	validate(keywords: string[], document: TextDocument): Diagnostic[] {
		this.document = document;
		let problems: Diagnostic[] = [];
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		this.parseDirective(dockerfile, document, problems);
		let instructions = dockerfile.getInstructions();
		if (instructions.length === 0 || dockerfile.getARGs().length === instructions.length) {
			// no instructions in this file, or only ARGs
			problems.push(Validator.createNoSourceImage(document.positionAt(0), document.positionAt(0)));
		}

		let cmds = dockerfile.getCMDs();
		if (cmds.length > 1) {
			// more than one CMD found, warn the user
			for (let cmd of cmds) {
				let diagnostic = this.createMultipleInstructions(cmd.getInstructionRange(), this.settings.instructionCmdMultiple, "CMD");
				if (diagnostic) {
					problems.push(diagnostic);
				}
			}
		}
		let entrypoints = dockerfile.getENTRYPOINTs();
		if (entrypoints.length > 1) {
			// more than one ENTRYPOINT found, warn the user
			for (let entrypoint of entrypoints) {
				let diagnostic = this.createMultipleInstructions(entrypoint.getInstructionRange(), this.settings.instructionEntrypointMultiple, "ENTRYPOINT");
				if (diagnostic) {
					problems.push(diagnostic);
				}
			}
		}
		let healthchecks = dockerfile.getHEALTHCHECKs();
		if (healthchecks.length > 1) {
			// more than one HEALTHCHECK found, warn the user
			for (let healthcheck of healthchecks) {
				let diagnostic = this.createMultipleInstructions(healthcheck.getInstructionRange(), this.settings.instructionHealthcheckMultiple, "HEALTHCHECK");
				if (diagnostic) {
					problems.push(diagnostic);
				}
			}
		}
		let hasFrom = false;
		for (let instruction of dockerfile.getInstructions()) {
			let keyword = instruction.getKeyword();
			if (keyword === "FROM") {
				hasFrom = true;
			} else if (!hasFrom && keyword !== "ARG") {
				// first non-ARG instruction is not a FROM
				let range = instruction.getInstructionRange();
				problems.push(Validator.createNoSourceImage(range.start, range.end));
				hasFrom = true;
			}
			if (keywords.indexOf(keyword) === -1) {
				let range = instruction.getInstructionRange();
				// invalid instruction found
				problems.push(Validator.createUnknownInstruction(range.start, range.end, keyword));
			} else  {
				if (keyword !== instruction.getInstruction()) {
					let range = instruction.getInstructionRange();
					// warn about uppercase convention if the keyword doesn't match the actual instruction
					let diagnostic = this.createUppercaseInstruction(range.start, range.end);
					if (diagnostic) {
						problems.push(diagnostic);
					}
				}

				if (keyword === "MAINTAINER") {
					let range = instruction.getInstructionRange();
					let diagnostic = this.createMaintainerDeprecated(range.start, range.end);
					if (diagnostic) {
						problems.push(diagnostic);
					}
				}

				validateInstruction: switch (keyword) {
					case "ARG":
						this.checkArguments(instruction, problems, [ -1 ], function(index: number, argument: string) {
							if (index > 0) {
								return  Validator.createARGRequiresOneArgument;
							}
							return null;
						}, Validator.createARGRequiresOneArgument);
						break;
					case "ENV":
						this.checkArguments(instruction, problems, [ -1 ], function() {
							return null;
						});
						let env = instruction as Env;
						let properties = env.getProperties();
						if (properties.length === 1 && properties[0].getValue() === null) {
							let range = properties[0].getNameRange();
							problems.push(Validator.createENVRequiresTwoArguments(range.start, range.end));
						} else if (properties.length !== 0) {
							for (let property of properties) {
								if (property.getValue() === null) {
									let range = property.getNameRange();
									problems.push(Validator.createSyntaxMissingEquals(range.start, range.end, property.getName()));
								}
							}
						}
						break;
					case "FROM":
						this.checkArguments(instruction, problems, [ 1, 3 ], function(index: number, argument: string) {
							if (index === 1) {
								return argument.toUpperCase() === "AS" ? null : Validator.createInvalidAs;
							}
							return null;
						}, Validator.createRequiresOneOrThreeArguments);
						break;
					case "HEALTHCHECK":
						let args = instruction.getArguments();
						if (args.length === 0) {
							// all instructions are expected to have at least one argument
							let range = instruction.getInstructionRange();
							problems.push(Validator.createMissingArgument(range.start, range.end));
						} else {
							// check all the args
							for (let i = 0; i < args.length; i++) {
								let value = args[i].getValue();
								let uppercase = value.toUpperCase();
								if (uppercase === "NONE") {
									if (i + 1 <= args.length - 1) {
										// get the next argument
										let start = args[i + 1].getRange().start;
										// get the last argument
										let end = args[args.length - 1].getRange().end;
										// highlight everything after the NONE and warn the user
										problems.push(Validator.createHealthcheckNoneUnnecessaryArgument(start, end));
									}
									// don't need to validate flags of a NONE
									break validateInstruction;
								}
							}

							let validFlags = [ "interval", "retries", "start-period", "timeout" ];
							let flags = (instruction as ModifiableInstruction).getFlags();
							for (let flag of flags) {
								let flagName = flag.getName();
								if (validFlags.indexOf(flagName) === -1) {
									let nameRange = flag.getNameRange();
									problems.push(Validator.createFlagUnknown(nameRange.start, nameRange.end, flag.getName()));
								} else if (flagName === "retries") {
									let value = flag.getValue();
									let valueRange = flag.getValueRange();
									let integer = parseInt(value);
									// test for NaN or numbers with decimals
									if (isNaN(integer) || value.indexOf('.') !== -1) {
										problems.push(Validator.createInvalidSyntax(valueRange.start, valueRange.end, value));
									} else if (integer < 1) {
										problems.push(Validator.createFlagAtLeastOne(valueRange.start, valueRange.end, "--retries", integer.toString()));
									}
								}
							}

							this.checkDuplicateFlags(flags, validFlags, problems);
						}
						break;
					case "STOPSIGNAL":
						this.checkArguments(instruction, problems, [ 1 ], function(index: number, argument: string) {
							if (argument.indexOf("SIG") === 0 || argument.indexOf('$') != -1) {
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
						this.checkArguments(instruction, problems, [ -1 ], function(index: number, argument: string) {
							for (var i = 0; i < argument.length; i++) {
								if (argument.charAt(i) !== '-' && ('0' > argument.charAt(i) || '9' < argument.charAt(i))) {
									return Validator.createInvalidPort;
								}
							}

							return argument.charAt(0) !== '-' && argument.charAt(argument.length - 1) !== '-' ? null : Validator.createInvalidPort;
						});
						break;
					case "COPY":
						this.checkArguments(instruction, problems, [ -1 ], function(index: number, argument: string, range: Range) {
							if (index === 0) {
								// see if the first argument is a --from=buildStage
								let diagnostic = this.checkFlagName(argument, range, "from");
								if (diagnostic !== null) {
									problems.push(diagnostic);
								}
							}
							return null;
						}.bind(this));
						let flags = (instruction as ModifiableInstruction).getFlags();
						this.checkDuplicateFlags(flags, [ "from" ], problems);
						break;
					default:
						this.checkArguments(instruction, problems, [ -1 ], function() {
							return null;
						});
						break;
				}
			}
		}

		return problems;
	}

	private checkFlagName(argument: string, range: Range, expectedFlagNames: string[]): Diagnostic {
		if (argument.indexOf("--") === 0) {
			let index = argument.indexOf('=');
			index = index === -1 ? argument.length : index;
			let actualFlagName = argument.substring(2, index);
			if (expectedFlagNames.indexOf(actualFlagName) === -1) {
				let offset = this.document.offsetAt(range.start);
				return Validator.createFlagUnknown(this.document.positionAt(offset + 2), this.document.positionAt(offset + 2 + actualFlagName.length), actualFlagName);
			}
		}
		return null;
	}

	private checkDuplicateFlags(flags: Flag[], validFlags: string[], problems: Diagnostic[]): void {
		let flagNames = flags.map(function(flag) {
			return flag.getName();
		});
		for (let validFlag of validFlags) {
			let index = flagNames.indexOf(validFlag);
			let lastIndex = flagNames.lastIndexOf(validFlag);
			if (index !== lastIndex) {
				let range = flags[index].getNameRange();
				problems.push(Validator.createFlagDuplicate(range.start, range.end, flagNames[index]));
				range = flags[lastIndex].getNameRange();
				problems.push(Validator.createFlagDuplicate(range.start, range.end, flagNames[index]));
			}
		}
	}

	private static dockerProblems = {
		"directiveCasing": "Parser directives should be written in lowercase letters",
		"directiveEscapeInvalid": "invalid ESCAPE '${0}'. Must be ` or \\",

		"noSourceImage": "No source image provided with `FROM`",

		"fromRequiresOneOrThreeArguments": "FROM requires either one or three arguments",

		"invalidAs": "Second argument should be AS",
		"invalidPort": "Invalid containerPort: ${0}",
		"invalidStopSignal": "Invalid signal: ${0}",
		"invalidSyntax": "parsing \"${0}\": invalid syntax",

		"syntaxMissingEquals": "Syntax error - can't find = in \"${0}\". Must be of the form: name=value",

		"flagAtLeastOne": "${0} must be at least 1 (not ${1})",
		"flagDuplicate": "Duplicate flag specified: ${0}",
		"flagUnknown": "Unknown flag: ${0}",

		"instructionExtraArgument": "Instruction has an extra argument",
		"instructionMissingArgument": "Instruction has no arguments",
		"instructionMultiple": "There can only be one ${0} instruction in a Dockerfile",
		"instructionRequiresOneArgument": "${0} requires exactly one argument",
		"instructionRequiresTwoArguments": "${0} must have two arguments",
		"instructionUnnecessaryArgument": "${0} takes no arguments",
		"instructionUnknown": "Unknown instruction: ${0}",
		"instructionCasing": "Instructions should be written in uppercase letters",

		"deprecatedMaintainer": "MAINTAINER has been deprecated",
	};
	
	private static formatMessage(text: string, ...variables: string[]): string {
		for (let i = 0; i < variables.length; i++) {
			text = text.replace("${" + i + "}", variables[i]);
		}
		return text;
	}

	public static getDiagnosticMessage_DirectiveCasing() {
		return Validator.dockerProblems["directiveCasing"];
	}

	public static getDiagnosticMessage_DirectiveEscapeInvalid(value: string) {
		return Validator.formatMessage(Validator.dockerProblems["directiveEscapeInvalid"], value);
	}

	public static getDiagnosticMessage_NoSourceImage() {
		return Validator.dockerProblems["noSourceImage"];
	}

	public static getDiagnosticMessage_FlagAtLeastOne(flagName: string, flagValue: string) {
		return Validator.formatMessage(Validator.dockerProblems["flagAtLeastOne"], flagName, flagValue);
	}

	public static getDiagnosticMessage_FlagDuplicate(flag: string) {
		return Validator.formatMessage(Validator.dockerProblems["flagDuplicate"], flag);
	}

	public static getDiagnosticMessage_FlagUnknown(flag: string) {
		return Validator.formatMessage(Validator.dockerProblems["flagUnknown"], flag);
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

	public static getDiagnosticMessage_InvalidSyntax(syntax: string) {
		return Validator.formatMessage(Validator.dockerProblems["invalidSyntax"], syntax);
	}

	public static getDiagnosticMessage_InstructionExtraArgument() {
		return Validator.dockerProblems["instructionExtraArgument"];
	}

	public static getDiagnosticMessage_InstructionMissingArgument() {
		return Validator.dockerProblems["instructionMissingArgument"];
	}

	public static getDiagnosticMessage_ARGRequiresOneArgument() {
		return Validator.formatMessage(Validator.dockerProblems["instructionRequiresOneArgument"], "ARG");
	}

	public static getDiagnosticMessage_ENVRequiresTwoArguments() {
		return Validator.formatMessage(Validator.dockerProblems["instructionRequiresTwoArguments"], "ENV");
	}

	public static getDiagnosticMessage_InstructionRequiresOneOrThreeArguments() {
		return Validator.dockerProblems["fromRequiresOneOrThreeArguments"];
	}

	public static getDiagnosticMessage_HealthcheckNoneUnnecessaryArgument() {
		return Validator.formatMessage(Validator.dockerProblems["instructionUnnecessaryArgument"], "HEALTHCHECK NONE");
	}

	public static getDiagnosticMessage_InstructionMultiple(instruction: string) {
		return Validator.formatMessage(Validator.dockerProblems["instructionMultiple"], instruction);
	}

	public static getDiagnosticMessage_InstructionUnknown(instruction: string) {
		return Validator.formatMessage(Validator.dockerProblems["instructionUnknown"], instruction);
	}

	public static getDiagnosticMessage_SyntaxMissingEquals(argument: string) {
		return Validator.formatMessage(Validator.dockerProblems["syntaxMissingEquals"], argument);
	}

	public static getDiagnosticMessage_InstructionCasing() {
		return Validator.dockerProblems["instructionCasing"];
	}

	public static getDiagnosticMessage_DeprecatedMaintainer() {
		return Validator.dockerProblems["deprecatedMaintainer"];
	}

	static createInvalidEscapeDirective(start: Position, end: Position, value: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_DirectiveEscapeInvalid(value), ValidationCode.INVALID_ESCAPE_DIRECTIVE);
	}

	static createFlagAtLeastOne(start: Position, end: Position, flagName: string, flagValue: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_FlagAtLeastOne(flagName, flagValue), ValidationCode.FLAG_AT_LEAST_ONE);
	}

	static createFlagDuplicate(start: Position, end: Position, flag: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_FlagDuplicate(flag), ValidationCode.FLAG_DUPLICATE);
	}

	static createFlagUnknown(start: Position, end: Position, flag: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_FlagUnknown(flag), ValidationCode.UNKNOWN_FLAG);
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

	static createInvalidSyntax(start: Position, end: Position, syntax: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InvalidSyntax(syntax), ValidationCode.INVALID_SYNTAX);
	}

	static createMissingArgument(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionMissingArgument(), ValidationCode.ARGUMENT_MISSING);
	}

	static createExtraArgument(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionExtraArgument(), ValidationCode.ARGUMENT_EXTRA);
	}

	private static createHealthcheckNoneUnnecessaryArgument(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_HealthcheckNoneUnnecessaryArgument(), ValidationCode.ARGUMENT_UNNECESSARY);
	}

	static createARGRequiresOneArgument(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_ARGRequiresOneArgument(), ValidationCode.ARGUMENT_REQUIRES_ONE);
	}

	static createENVRequiresTwoArguments(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_ENVRequiresTwoArguments(), ValidationCode.ARGUMENT_REQUIRES_TWO);
	}

	static createRequiresOneOrThreeArguments(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionRequiresOneOrThreeArguments(), ValidationCode.ARGUMENT_REQUIRES_ONE_OR_THREE);
	}

	static createNoSourceImage(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_NoSourceImage(), ValidationCode.NO_SOURCE_IMAGE);
	}

	static createSyntaxMissingEquals(start: Position, end: Position, argument: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_SyntaxMissingEquals(argument), ValidationCode.SYNTAX_MISSING_EQUALS);
	}

	static createUnknownInstruction(start: Position, end: Position, instruction: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionUnknown(instruction), ValidationCode.UNKNOWN_INSTRUCTION);
	}

	static createError(start: Position, end: Position, description: string, code?: ValidationCode): Diagnostic {
		return Validator.createDiagnostic(DiagnosticSeverity.Error, start, end, description, code);
	}

	private createMultipleInstructions(range: Range, severity: ValidationSeverity, instruction: string): Diagnostic {
		if (severity === ValidationSeverity.ERROR) {
			return Validator.createError(range.start, range.end, Validator.getDiagnosticMessage_InstructionMultiple(instruction), ValidationCode.MULTIPLE_INSTRUCTIONS);
		} else if (severity  === ValidationSeverity.WARNING) {
			return Validator.createWarning(range.start, range.end, Validator.getDiagnosticMessage_InstructionMultiple(instruction), ValidationCode.MULTIPLE_INSTRUCTIONS);
		}
		return null;
	}

	private createLowercaseDirective(start: Position, end: Position): Diagnostic {
		if (this.settings.directiveCasing === ValidationSeverity.ERROR) {
			return Validator.createError(start, end, Validator.getDiagnosticMessage_DirectiveCasing(), ValidationCode.CASING_DIRECTIVE);
		} else if (this.settings.directiveCasing === ValidationSeverity.WARNING) {
			return Validator.createWarning(start, end, Validator.getDiagnosticMessage_DirectiveCasing(), ValidationCode.CASING_DIRECTIVE);
		}
		return null;
	}

	createUppercaseInstruction(start: Position, end: Position): Diagnostic {
		if (this.settings.instructionCasing === ValidationSeverity.ERROR) {
			return Validator.createError(start, end, Validator.getDiagnosticMessage_InstructionCasing(), ValidationCode.CASING_INSTRUCTION);
		} else if (this.settings.instructionCasing === ValidationSeverity.WARNING) {
			return Validator.createWarning(start, end, Validator.getDiagnosticMessage_InstructionCasing(), ValidationCode.CASING_INSTRUCTION);
		}
		return null;
	}

	createMaintainerDeprecated(start: Position, end: Position): Diagnostic | null {
		if (this.settings.deprecatedMaintainer === ValidationSeverity.ERROR) {
			return Validator.createError(start, end, Validator.getDiagnosticMessage_DeprecatedMaintainer(), ValidationCode.DEPRECATED_MAINTAINER);
		} else if (this.settings.deprecatedMaintainer === ValidationSeverity.WARNING) {
			return Validator.createWarning(start, end, Validator.getDiagnosticMessage_DeprecatedMaintainer(), ValidationCode.DEPRECATED_MAINTAINER);
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