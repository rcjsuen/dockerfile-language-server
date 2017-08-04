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
import { Label } from './parser/instructions/label';
import { Healthcheck } from './parser/instructions/healthcheck';
import { Onbuild } from './parser/instructions/onbuild';
import { ModifiableInstruction } from './parser/instructions/modifiableInstruction';
import { DockerfileParser } from './parser/dockerfileParser';
import { DIRECTIVE_ESCAPE, KEYWORDS } from './docker';
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
	FLAG_INVALID_DURATION,
	FLAG_LESS_THAN_1MS,
	FLAG_MISSING_DURATION,
	FLAG_MISSING_VALUE,
	NO_SOURCE_IMAGE,
	INVALID_ESCAPE_DIRECTIVE,
	INVALID_AS,
	INVALID_PORT,
	INVALID_SIGNAL,
	INVALID_SYNTAX,
	ONBUILD_CHAINING_DISALLOWED,
	ONBUILD_TRIGGER_DISALLOWED,
	SHELL_JSON_FORM,
	SHELL_REQUIRES_ONE,
	SYNTAX_MISSING_EQUALS,
	SYNTAX_MISSING_NAMES,
	MULTIPLE_INSTRUCTIONS,
	UNKNOWN_INSTRUCTION,
	UNKNOWN_FLAG,
	DEPRECATED_MAINTAINER,
	HEALTHCHECK_CMD_ARGUMENT_MISSING
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
			this.validateInstruction(keywords, instruction, keyword, problems);
		}

		for (let instruction of dockerfile.getOnbuildTriggers()) {
			this.validateInstruction(keywords, instruction, instruction.getKeyword(), problems);
		}
		return problems;
	}

	private validateInstruction(keywords: string[], instruction: Instruction, keyword: string, problems: Diagnostic[]): void {
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
				case "CMD":
					// don't validate CMD instructions
					break;
				case "ARG":
					this.checkArguments(instruction, problems, [ -1 ], function(index: number, argument: string) {
						if (index > 0) {
							return  Validator.createARGRequiresOneArgument;
						}
						return null;
					}, Validator.createARGRequiresOneArgument);
					break;
				case "ENV":
				case "LABEL":
					this.checkArguments(instruction, problems, [ -1 ], function() {
						return null;
					});
					let properties = instruction instanceof Env ? (instruction as Env).getProperties() : (instruction as Label).getProperties();
					if (properties.length === 1 && properties[0].getValue() === null) {
						let range = properties[0].getNameRange();
						problems.push(Validator.createENVRequiresTwoArguments(range.start, range.end));
					} else if (properties.length !== 0) {
						for (let property of properties) {
							if (property.getName() === "") {
								let range = property.getRange();
								problems.push(Validator.createSyntaxMissingNames(range.start, range.end, keyword));
							}
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
							} else if (uppercase === "CMD") {
								if (i === args.length - 1) {
									let range = args[i].getRange();
									problems.push(Validator.createHealthcheckCmdArgumentMissing(range.start, range.end));
								}
								break;
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
								if (value) {
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
						}

						this.checkFlagValue(flags, validFlags, problems);
						this.checkFlagDuration(flags, [ "interval", "start-period", "timeout" ], problems);
						this.checkDuplicateFlags(flags, validFlags, problems);
					}
					break;
				case "ONBUILD":
					this.checkArguments(instruction, problems, [ -1 ], function() {
						return null;
					});
					let onbuild = instruction as Onbuild;
					let trigger = onbuild.getTrigger();
					switch (trigger) {
						case "FROM":
						case "MAINTAINER":
							problems.push(Validator.createOnbuildTriggerDisallowed(onbuild.getTriggerRange(), trigger));
							break;
						case "ONBUILD":
							problems.push(Validator.createOnbuildChainingDisallowed(onbuild.getTriggerRange()));
							break;
					}
					break;
				case "SHELL":
					this.checkArguments(instruction, problems, [ -1 ], function() {
						return null;
					});
					this.checkJSON(instruction, problems);
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
						const regex = /^(([0-9])+(-[0-9]+)?(:([0-9])+(-[0-9]*)?)?(\/[A-Za-z]*)?)$/g;
						return regex.exec(argument) !== null ? null : Validator.createInvalidPort;
					});
					break;
				case "COPY":
					let copyArgs = instruction.getArguments();
					if (copyArgs.length === 0) {
						let range = instruction.getInstructionRange();
						problems.push(Validator.createMissingArgument(range.start, range.end));
					} else {
						let flags = (instruction as ModifiableInstruction).getFlags();
						if (flags.length > 0 && flags[0].getName() !== "from") {
							let range = flags[0].getNameRange();
							problems.push(Validator.createFlagUnknown(range.start, range.end, flags[0].getName()));
						}
						this.checkFlagValue(flags, [ "from" ], problems);
						this.checkDuplicateFlags(flags, [ "from" ], problems);
					}
					break;
				default:
					this.checkArguments(instruction, problems, [ -1 ], function() {
						return null;
					});
					break;
			}
		}
	}

	private checkFlagValue(flags: Flag[], validFlagNames: string[], problems: Diagnostic[]): void {
		for (let flag of flags) {
			let flagName = flag.getName();
			// only validate flags with the right name
			if (flag.getValue() === null && validFlagNames.indexOf(flagName) !== -1) {
				let range = flag.getNameRange();
				problems.push(Validator.createFlagMissingValue(range.start, range.end, flagName));
			}
		}
	}

	private checkFlagDuration(flags: Flag[], validFlagNames: string[], problems: Diagnostic[]): void {
		flagCheck: for (let flag of flags) {
			let flagName = flag.getName();
			// only validate flags with the right name
			if (validFlagNames.indexOf(flagName) !== -1) {
				let value = flag.getValue();
				if (value !== null && value.length !== 0) {
					switch (value.charAt(0)) {
						case '0':
						case '1':
						case '2':
						case '3':
						case '4':
						case '5':
						case '6':
						case '7':
						case '8':
						case '9':
						case '-':
							break;
						default:
							let range = flag.getValueRange();
							problems.push(Validator.createFlagInvalidDuration(range.start, range.end, value));
							continue flagCheck;
					}

					let durationSpecified = false;
					let start = 0;
					let duration = 0;
					durationParse: for (let i = 0; i < value.length; i++) {
						durationSpecified = false;
						switch (value.charAt(i)) {
							case '-':
							case '0':
							case '1':
							case '2':
							case '3':
							case '4':
							case '5':
							case '6':
							case '7':
							case '8':
							case '9':
								continue;
							default:
								let time = parseInt(value.substring(start, i));
								for (let j = i + 1; j < value.length; j++) {
									if (Validator.isNumberRelated(value.charAt(j))) {
										let unit = value.substring(i, j);
										if (time < 0 || (value.charAt(start) === '-' && time === 0)) {
											let nameRange = flag.getNameRange();
											problems.push(Validator.createFlagLessThan1ms(nameRange.start, nameRange.end, flagName));
											continue flagCheck;
										}
										switch (unit) {
											case 'h':
												// hours
												duration += time * 1000 * 60 * 60;
												i = j - 1;
												start = i;
												durationSpecified = true;
												continue durationParse;
											case 'm':
												// minutes
												duration += time * 1000 * 60;
												i = j - 1;
												start = i;
												durationSpecified = true;
												continue durationParse;
											case 's':
												// seconds
												duration += time * 1000;
												i = j - 1;
												start = i;
												durationSpecified = true;
												continue durationParse;
											case "ms":
												// milliseconds
												duration += time;
												i = j - 1;
												start = i;
												durationSpecified = true;
												continue durationParse;
											case "us":
											case "µs":
												// microseconds
												duration += time / 1000;
												i = j - 1;
												start = i;
												durationSpecified = true;
												continue durationParse;
											case "ns":
												// nanoseconds
												duration += time / 1000000;
												i = j - 1;
												start = i;
												durationSpecified = true;
												continue durationParse;
										}
									}
								}
								if (time < 0 || (value.charAt(start) === '-' && time === 0)) {
									let nameRange = flag.getNameRange();
									problems.push(Validator.createFlagLessThan1ms(nameRange.start, nameRange.end, flagName));
									continue flagCheck;
								}
								let unit = value.substring(i, value.length);
								switch (unit) {
									case 'h':
										// hours
										duration += time * 1000 * 60 * 60;
										durationSpecified = true;
										break durationParse;
									case 'm':
										// minutes
										duration += time * 1000 * 60;
										durationSpecified = true;
										break durationParse;
									case 's':
										// seconds
										duration += time * 1000;
										durationSpecified = true;
										break durationParse;
									case "ms":
										// minutes
										duration += time;
										durationSpecified = true;
										break durationParse;
									case "us":
									case "µs":
										// microseconds
										duration += time / 1000;
										durationSpecified = true;
										break durationParse;
									case "ns":
										// nanoseconds
										duration += time / 1000000;
										durationSpecified = true;
										break durationParse;
								}
								continue flagCheck;
						}	
					}

					if (!durationSpecified) {
						let range = flag.getValueRange();
						problems.push(Validator.createFlagMissingDuration(range.start, range.end, value));
					} else if (duration < 1) {
						let range = flag.getNameRange();
						problems.push(Validator.createFlagLessThan1ms(range.start, range.end, flagName));
					}
				}
			}
		}
	}

	private static isNumberRelated(character: string) {
		switch (character) {
			case '-':
			case '.':
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				return true;
		}
		return false;
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

	private checkJSON(instruction: Instruction, problems: Diagnostic[]) {
		let argsContent = instruction.getArgumentsContent();
		if (argsContent === null) {
			return;
		}

		let argsRange = instruction.getArgumentsRange();
		let args = instruction.getArguments();
		if ((args.length === 1 && args[0].getValue() === "[]") ||
				(args.length === 2 && args[0].getValue() === '[' && args[1].getValue() === ']')) {
			problems.push(Validator.createShellRequiresOne(argsRange));
			return;
		}

		let last = "";
		let quoted = false;
		argsCheck: for (let i = 0; i < argsContent.length; i++) {
			switch (argsContent.charAt(i)) {
				case '[':
					if (last === "") {
						last = '[';
					} else if (!quoted) {
						break argsCheck;
					}
					break;
				case '"':
					if (last === '[' || last === ',') {
						quoted = true;
						last = '"';
						continue;
					} else if (last === '"') {
						if (quoted) {
							// quoted string done
							quoted = false;
						} else {
							// should be a , or a ]
							break argsCheck;
						}
					} else {
						break argsCheck;
					}
					break;
				case ',':
					if (!quoted) {
						if (last === '"') {
							last = ','
						} else {
							break argsCheck;
						}
					}
					break;
				case ']':
					if (!quoted) {
						if (last === null) {
							last = ']';
							break argsCheck;
						} else if (last !== ',') {
							last = null;
						}
					}
					break;
				case ' ':
				case '\t':
					break;
				case '\\':
					if (quoted) {
						if (argsContent.charAt(i + 1) === '"' || argsContent.charAt(i + 1) === '\\') {
							i = i + 1;
						}
					} else {
						for (let j = i + 1; j < argsContent.length; j++) {
							switch (argsContent.charAt(j)) {
								case '\r':
									if (argsContent.charAt(j + 1) === '\n') {
										j++;
									}
								case '\n':
									i = j;
									continue argsCheck;
								case ' ':
								case '\t':
									break;
								default:
									break argsCheck;
							}
						}
					}
					break;
				default:
					if (!quoted) {
						break argsCheck;
					}
					break;
			}
		}

		if (last !== null) {
			problems.push(Validator.createShellJsonForm(argsRange));
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
		"syntaxMissingNames": "${0} names can not be blank",

		"flagAtLeastOne": "${0} must be at least 1 (not ${1})",
		"flagDuplicate": "Duplicate flag specified: ${0}",
		"flagInvalidDuration": "time: invalid duration ${0}",
		"flagLessThan1ms": "Interval \"${0}\" cannot be less than 1ms",
		"flagMissingDuration": "time: missing unit in duration ${0}",
		"flagMissingValue": "Missing a value on flag: ${0}",
		"flagUnknown": "Unknown flag: ${0}",

		"instructionExtraArgument": "Instruction has an extra argument",
		"instructionMissingArgument": "Instruction has no arguments",
		"instructionMultiple": "There can only be one ${0} instruction in a Dockerfile",
		"instructionRequiresOneArgument": "${0} requires exactly one argument",
		"instructionRequiresTwoArguments": "${0} must have two arguments",
		"instructionUnnecessaryArgument": "${0} takes no arguments",
		"instructionUnknown": "Unknown instruction: ${0}",
		"instructionCasing": "Instructions should be written in uppercase letters",

		"onbuildChainingDisallowed": "Chaining ONBUILD via `ONBUILD ONBUILD` isn't allowed",
		"onbuildTriggerDisallowed": "${0} isn't allowed as an ONBUILD trigger",

		"shellJsonForm": "SHELL requires the arguments to be in JSON form",
		"shellRequiresOne": "SHELL requires at least one argument",

		"deprecatedMaintainer": "MAINTAINER has been deprecated",

		"healthcheckCmdArgumentMissing": "Missing command after HEALTHCHECK CMD",
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

	public static getDiagnosticMessage_FlagInvalidDuration(flag: string) {
		return Validator.formatMessage(Validator.dockerProblems["flagInvalidDuration"], flag);
	}

	public static getDiagnosticMessage_FlagLessThan1ms(flag: string) {
		return Validator.formatMessage(Validator.dockerProblems["flagLessThan1ms"], flag);
	}

	public static getDiagnosticMessage_FlagMissingDuration(duration: string) {
		return Validator.formatMessage(Validator.dockerProblems["flagMissingDuration"], duration);
	}

	public static getDiagnosticMessage_FlagMissingValue(flag: string) {
		return Validator.formatMessage(Validator.dockerProblems["flagMissingValue"], flag);
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

	public static getDiagnosticMessage_SyntaxMissingNames(instruction: string) {
		return Validator.formatMessage(Validator.dockerProblems["syntaxMissingNames"], instruction);
	}

	public static getDiagnosticMessage_InstructionCasing() {
		return Validator.dockerProblems["instructionCasing"];
	}

	public static getDiagnosticMessage_OnbuildChainingDisallowed() {
		return Validator.dockerProblems["onbuildChainingDisallowed"];
	}

	public static getDiagnosticMessage_OnbuildTriggerDisallowed(trigger: string) {
		return Validator.formatMessage(Validator.dockerProblems["onbuildTriggerDisallowed"], trigger);
	}

	public static getDiagnosticMessage_ShellJsonForm() {
		return Validator.dockerProblems["shellJsonForm"];
	}

	public static getDiagnosticMessage_ShellRequiresOne() {
		return Validator.dockerProblems["shellRequiresOne"];
	}

	public static getDiagnosticMessage_DeprecatedMaintainer() {
		return Validator.dockerProblems["deprecatedMaintainer"];
	}

	public static getDiagnosticMessage_HealthcheckCmdArgumentMissing() {
		return Validator.dockerProblems["healthcheckCmdArgumentMissing"];
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

	private static createFlagInvalidDuration(start: Position, end: Position, flag: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_FlagInvalidDuration(flag), ValidationCode.FLAG_INVALID_DURATION);
	}

	private static createFlagLessThan1ms(start: Position, end: Position, flag: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_FlagLessThan1ms(flag), ValidationCode.FLAG_LESS_THAN_1MS);
	}

	private static createFlagMissingDuration(start: Position, end: Position, duration: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_FlagMissingDuration(duration), ValidationCode.FLAG_MISSING_DURATION);
	}

	static createFlagMissingValue(start: Position, end: Position, flag: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_FlagMissingValue(flag), ValidationCode.FLAG_MISSING_VALUE);
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

	private static createHealthcheckCmdArgumentMissing(start: Position, end: Position): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_HealthcheckCmdArgumentMissing(), ValidationCode.HEALTHCHECK_CMD_ARGUMENT_MISSING);
	}

	private static createOnbuildChainingDisallowed(range: Range): Diagnostic {
		return Validator.createError(range.start, range.end, Validator.getDiagnosticMessage_OnbuildChainingDisallowed(), ValidationCode.ONBUILD_CHAINING_DISALLOWED);
	}

	private static createOnbuildTriggerDisallowed(range: Range, trigger: string): Diagnostic {
		return Validator.createError(range.start, range.end, Validator.getDiagnosticMessage_OnbuildTriggerDisallowed(trigger), ValidationCode.ONBUILD_TRIGGER_DISALLOWED);
	}

	private static createShellJsonForm(range: Range): Diagnostic {
		return Validator.createError(range.start, range.end, Validator.getDiagnosticMessage_ShellJsonForm(), ValidationCode.SHELL_JSON_FORM);
	}

	private static createShellRequiresOne(range: Range): Diagnostic {
		return Validator.createError(range.start, range.end, Validator.getDiagnosticMessage_ShellRequiresOne(), ValidationCode.SHELL_REQUIRES_ONE);
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

	private static createSyntaxMissingNames(start: Position, end: Position, instruction: string): Diagnostic {
		return Validator.createError(start, end, Validator.getDiagnosticMessage_SyntaxMissingNames(instruction), ValidationCode.SYNTAX_MISSING_NAMES);
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