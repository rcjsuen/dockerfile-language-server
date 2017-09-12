/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as assert from "assert";

import { TextDocument, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { Validator, ValidationCode, ValidationSeverity } from '../src/dockerValidator';
import { ValidatorSettings } from '../src/dockerValidatorSettings';
import { KEYWORDS } from '../src/docker';

let source = "dockerfile-lsp";

function createDocument(content: string): any {
	return TextDocument.create("uri://host/Dockerfile.sample", "dockerfile", 1, content);
}

function validate(content: string, settings?: ValidatorSettings) {
	if (!settings) {
		settings = {
			deprecatedMaintainer: ValidationSeverity.IGNORE,
			directiveCasing: ValidationSeverity.WARNING,
			instructionCasing: ValidationSeverity.WARNING,
			instructionCmdMultiple: ValidationSeverity.IGNORE,
			instructionEntrypointMultiple: ValidationSeverity.IGNORE,
			instructionHealthcheckMultiple: ValidationSeverity.IGNORE
		};
	}
	let validator = new Validator(settings);
	return validator.validate(KEYWORDS, createDocument(content));
}

function assertDiagnostics(diagnostics: Diagnostic[], codes: ValidationCode[], functions: Function[], args: any[][]) {
	assert.equal(diagnostics.length, codes.length);
	diagnosticCheck: for (let diagnostic of diagnostics) {
		for (let i = 0; i < codes.length; i++) {
			if (diagnostic.code === codes[i]) {
				args[i].unshift(diagnostic);
				functions[i].apply(null, args[i]);
				continue diagnosticCheck;
			}
		}
		throw new Error("Diagnostic with code " + diagnostic.code + " not expected");
	}
}

function assertNoSourceImage(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.NO_SOURCE_IMAGE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_NoSourceImage());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagAtLeastOne(diagnostic: Diagnostic, flagName: string, flagValue: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.FLAG_AT_LEAST_ONE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagAtLeastOne(flagName, flagValue));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagDuplicate(diagnostic: Diagnostic, flag: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.FLAG_DUPLICATE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagDuplicate(flag));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagInvalidDuration(diagnostic: Diagnostic, flag: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.FLAG_INVALID_DURATION);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagInvalidDuration(flag));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagLessThan1ms(diagnostic: Diagnostic, flag: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.FLAG_LESS_THAN_1MS);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagLessThan1ms(flag));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagMissingDuration(diagnostic: Diagnostic, duration: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.FLAG_MISSING_DURATION);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagMissingDuration(duration));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagMissingValue(diagnostic: Diagnostic, flag: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.FLAG_MISSING_VALUE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagMissingValue(flag));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagUnknown(diagnostic: Diagnostic, flag: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.UNKNOWN_FLAG);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagUnknown(flag));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertFlagUnknownUnit(diagnostic: Diagnostic, unit: string, duration: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.FLAG_UNKNOWN_UNIT);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagUnknownUnit(unit, duration));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertUnknownHealthcheckFlag(diagnostic: Diagnostic, flag: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.UNKNOWN_HEALTHCHECK_FLAG);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_FlagUnknown(flag));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInvalidAs(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_AS);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidAs());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInvalidPort(diagnostic: Diagnostic, port: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_PORT);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidPort(port));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInvalidProto(diagnostic: Diagnostic, protocol: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_PROTO);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidProto(protocol));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInvalidStopSignal(diagnostic: Diagnostic, signal: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_SIGNAL);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidSignal(signal));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInvalidSyntax(diagnostic: Diagnostic, syntax: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_SYNTAX);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidSyntax(syntax));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertDirectiveCasing(diagnostic: Diagnostic, severity: DiagnosticSeverity, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.CASING_DIRECTIVE);
	assert.equal(diagnostic.severity, severity);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_DirectiveCasing());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionCasing(diagnostic: Diagnostic, severity: DiagnosticSeverity, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.CASING_INSTRUCTION);
	assert.equal(diagnostic.severity, severity);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionCasing());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionExtraArgument(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_EXTRA);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionExtraArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionMissingArgument(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_MISSING);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionMissingArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionMultiple(diagnostic: Diagnostic, severity: DiagnosticSeverity, instruction: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.MULTIPLE_INSTRUCTIONS);
	assert.equal(diagnostic.severity, severity);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionMultiple(instruction));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionRequiresOneArgument(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_REQUIRES_ONE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_ARGRequiresOneArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertHealthcheckCmdArgumentMissing(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.HEALTHCHECK_CMD_ARGUMENT_MISSING);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_HealthcheckCmdArgumentMissing());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertCOPYRequiresAtLeastTwoArguments(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_REQUIRES_AT_LEAST_TWO);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_COPYRequiresAtLeastTwoArguments());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertENVRequiresTwoArguments(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_REQUIRES_TWO);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_ENVRequiresTwoArguments());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionRequiresOneOrThreeArguments(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_REQUIRES_ONE_OR_THREE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionRequiresOneOrThreeArguments());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionUnnecessaryArgument(diagnostic: Diagnostic, instruction: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ARGUMENT_UNNECESSARY);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_HealthcheckNoneUnnecessaryArgument());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInstructionUnknown(diagnostic: Diagnostic, instruction: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.UNKNOWN_INSTRUCTION);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InstructionUnknown(instruction));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertOnbuildChainingDisallowed(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ONBUILD_CHAINING_DISALLOWED);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_OnbuildChainingDisallowed());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertShellJsonForm(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.SHELL_JSON_FORM);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_ShellJsonForm());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertShellRequiresOne(diagnostic: Diagnostic, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.SHELL_REQUIRES_ONE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_ShellRequiresOne());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertOnbuildTriggerDisallowed(diagnostic: Diagnostic, trigger: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.ONBUILD_TRIGGER_DISALLOWED);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_OnbuildTriggerDisallowed(trigger));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertDirectiveEscapeInvalid(diagnostic: Diagnostic, value: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_ESCAPE_DIRECTIVE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_DirectiveEscapeInvalid(value));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertDeprecatedMaintainer(diagnostic: Diagnostic, severity: DiagnosticSeverity, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.DEPRECATED_MAINTAINER);
	assert.equal(diagnostic.severity, severity);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_DeprecatedMaintainer());
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertSyntaxMissingEquals(diagnostic: Diagnostic, argument: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.SYNTAX_MISSING_EQUALS);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_SyntaxMissingEquals(argument));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertSyntaxMissingNames(diagnostic: Diagnostic, instrument: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.SYNTAX_MISSING_NAMES);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_SyntaxMissingNames(instrument));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertSyntaxMissingSingleQuote(diagnostic: Diagnostic, key: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.SYNTAX_MISSING_SINGLE_QUOTE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_SyntaxMissingSingleQuote(key));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertSyntaxMissingDoubleQuote(diagnostic: Diagnostic, key: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.SYNTAX_MISSING_DOUBLE_QUOTE);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_SyntaxMissingDoubleQuote(key));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertDuplicateBuildStageName(diagnostic: Diagnostic, name: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.DUPLICATE_BUILD_STAGE_NAME);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_DuplicateBuildStageName(name));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function assertInvalidBuildStageName(diagnostic: Diagnostic, name: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number) {
	assert.equal(diagnostic.code, ValidationCode.INVALID_BUILD_STAGE_NAME);
	assert.equal(diagnostic.severity, DiagnosticSeverity.Error);
	assert.equal(diagnostic.source, source);
	assert.equal(diagnostic.message, Validator.getDiagnosticMessage_InvalidBuildStageName(name));
	assert.equal(diagnostic.range.start.line, startLine);
	assert.equal(diagnostic.range.start.character, startCharacter);
	assert.equal(diagnostic.range.end.line, endLine);
	assert.equal(diagnostic.range.end.character, endCharacter);
}

function testValidArgument(instruction: string, argument: string) {
	let gaps = [ " ", "\t", " \\\n", " \\\r", " \\\r\n" ];
	for (let gap of gaps) {
		let diagnostics = validate("FROM node\n" + instruction + gap + argument);
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " ");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r\n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " \n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " \r");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + " \r\n");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\n ");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r ");
		assert.equal(diagnostics.length, 0);

		diagnostics = validate("FROM node\n" + instruction + gap + argument + "\r\n ");
		assert.equal(diagnostics.length, 0);
	}
}

function testEscape(instruction: string, argumentFront: string, argumentBack: string) {
	var argument = argumentFront + argumentBack;
	let diagnostics = validate("FROM node\n" + instruction + " \\\n" + argument);
	assert.equal(diagnostics.length, 0);
	
	diagnostics = validate("FROM node\n" + instruction + " \\\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + "\\\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\ \n" + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + "\\ \n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\ \n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\  \n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\t\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\t\t\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\  \r " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\t\r " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\t\t\r " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\r\n" + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + "\\\r\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\\r\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\ \r\n" + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + "\\ \r\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " \\ \r\n " + argument);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argument + "\\\n");
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\n" + argumentBack);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\r\n" + argumentBack);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\r\n" + argumentBack);
	assert.equal(diagnostics.length, 0);

	diagnostics = validate("FROM node\n" + instruction + " " + argumentFront + "\\\r\n" + argumentBack + "\n");
	assert.equal(diagnostics.length, 0);
}

describe("Docker Validator Tests", function() {
	describe("no content", function() {
		it("empty file", function() {
			let diagnostics = validate("");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("whitespace only", function() {
			let diagnostics = validate(" \t\r\n");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("comments only", function() {
			let diagnostics = validate("# This is a comment");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);

			diagnostics = validate("#=This is a comment");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("directive only", function() {
			let diagnostics = validate("# escape=`");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);

			diagnostics = validate("# escape=\\");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});

		it("FROM in comment", function() {
			let diagnostics = validate("# FROM node");
			assert.equal(diagnostics.length, 1);
			assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
		});
	});

	function createUppercaseStyleTest(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let triggerLength = onbuild.length;
		describe("uppercase style check", function() {
			function testCasingStyle(mixed: string, argument: string) {
				var length = mixed.length;
				let diagnostics = validate("FROM node\n" + onbuild + mixed.toUpperCase() + " " + argument);
				if (trigger) {
					switch (mixed.toUpperCase()) {
						case "FROM":
						case "MAINTAINER":
							assert.equal(diagnostics.length, 1);
							assertOnbuildTriggerDisallowed(diagnostics[0], mixed.toUpperCase(), 1, triggerLength, 1, triggerLength + length);
							break;
						case "ONBUILD":
							assert.equal(diagnostics.length, 1);
							assertOnbuildChainingDisallowed(diagnostics[0], 1, triggerLength, 1, triggerLength + length);
							break;
						default:
							assert.equal(diagnostics.length, 0);
							break;
					}
				} else {
					assert.equal(diagnostics.length, 0);
				}

				diagnostics = validate("FROM node\n" + onbuild + mixed.toLowerCase() + " " + argument);
				if (trigger) {
					switch (mixed.toUpperCase()) {
						case "FROM":
						case "MAINTAINER":
							assert.equal(diagnostics.length, 2);
							assertDiagnostics(diagnostics,
								[ ValidationCode.ONBUILD_TRIGGER_DISALLOWED, ValidationCode.CASING_INSTRUCTION ],
								[ assertOnbuildTriggerDisallowed, assertInstructionCasing ],
								[ [ mixed.toUpperCase(), 1, triggerLength, 1, triggerLength + length ],
									[ DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length ] ]);
							break;
						case "ONBUILD":
							assert.equal(diagnostics.length, 2);
							assertDiagnostics(diagnostics,
								[ ValidationCode.ONBUILD_CHAINING_DISALLOWED, ValidationCode.CASING_INSTRUCTION ],
								[ assertOnbuildChainingDisallowed, assertInstructionCasing ],
								[ [ 1, triggerLength, 1, triggerLength + length ],
									[ DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length ] ]);
							break;
						default:
							assert.equal(diagnostics.length, 1);
							assertInstructionCasing(diagnostics[0], DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length);
							break;
					}
				} else {
					assert.equal(diagnostics.length, 1);
					assertInstructionCasing(diagnostics[0], DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length);
				}

				diagnostics = validate("FROM node\n" + onbuild + mixed + " " + argument);
				if (trigger) {
					switch (mixed.toUpperCase()) {
						case "FROM":
						case "MAINTAINER":
							assert.equal(diagnostics.length, 2);
							assertDiagnostics(diagnostics,
								[ ValidationCode.ONBUILD_TRIGGER_DISALLOWED, ValidationCode.CASING_INSTRUCTION ],
								[ assertOnbuildTriggerDisallowed, assertInstructionCasing ],
								[ [ mixed.toUpperCase(), 1, triggerLength, 1, triggerLength + length ],
									[ DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length ] ]);
							break;
						case "ONBUILD":
							assert.equal(diagnostics.length, 2);
							assertDiagnostics(diagnostics,
								[ ValidationCode.ONBUILD_CHAINING_DISALLOWED, ValidationCode.CASING_INSTRUCTION ],
								[ assertOnbuildChainingDisallowed, assertInstructionCasing ],
								[ [ 1, triggerLength, 1, triggerLength + length ],
									[ DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length ] ]);
							break;
						default:
							assert.equal(diagnostics.length, 1);
							assertInstructionCasing(diagnostics[0], DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length);
							break;
					}
				} else {
					assert.equal(diagnostics.length, 1);
					assertInstructionCasing(diagnostics[0], DiagnosticSeverity.Warning, 1, triggerLength, 1, triggerLength + length);
				}

				diagnostics = validate("FROM node\n#" + onbuild + mixed.toLowerCase() + " " + argument);
				assert.equal(diagnostics.length, 0);
			}

			it("ADD", function() {
				testCasingStyle("aDd", "source dest");
			});

			it("ARG", function() {
				testCasingStyle("aRg", "name");
			});

			it("CMD", function() {
				testCasingStyle("cMd", "[ \"/bin/ls\" ]");
			});

			it("COPY", function() {
				testCasingStyle("copY", "source dest");
			});

			it("ENTRYPOINT", function() {
				testCasingStyle("entryPOINT", "[ \"/usr/bin/sh\" ]");
			});

			it("ENV", function() {
				testCasingStyle("EnV", "key=value");
			});

			it("EXPOSE", function() {
				testCasingStyle("expOSe", "8080");
			});

			it("FROM", function() {
				testCasingStyle("fROm", "node");
			});

			it("HEALTHCHECK", function() {
				testCasingStyle("healTHCHeck", "NONE");
			});

			it("LABEL", function() {
				testCasingStyle("LAbel", "key=value");
			});

			it("MAINTAINER", function() {
				testCasingStyle("maINTaiNER", "authorName");
			});

			it("ONBUILD", function() {
				testCasingStyle("onBUILD", "HEALTHCHECK NONE");
			});

			it("RUN", function() {
				testCasingStyle("rUN", "apt-get update");
			});

			it("SHELL", function() {
				testCasingStyle("shELL", "[ \"powershell\" ]");
			});

			it("STOPSIGNAL", function() {
				testCasingStyle("stopSIGNal", "9");
			});

			it("USER", function() {
				testCasingStyle("uSEr", "daemon");
			});

			it("VOLUME", function() {
				testCasingStyle("VOLume", "[ \"/data\" ]");
			});

			it("WORKDIR", function() {
				testCasingStyle("workDIR", "/path");
			});

			it("default", function() {
				let validator = new Validator();
				let diagnostics = validator.validate(KEYWORDS, createDocument("from busybox"));
				assert.equal(diagnostics.length, 1);
				assertInstructionCasing(diagnostics[0], DiagnosticSeverity.Warning, 0, 0, 0, 4);
			});

			it("ignore", function() {
				let diagnostics = validate("fROm busybox", { instructionCasing: ValidationSeverity.IGNORE });
				assert.equal(diagnostics.length, 0);
			});

			it("warning", function() {
				let diagnostics = validate("fROm busybox", { instructionCasing: ValidationSeverity.WARNING });
				assert.equal(diagnostics.length, 1);
				assertInstructionCasing(diagnostics[0], DiagnosticSeverity.Warning, 0, 0, 0, 4);
			});

			it("error", function() {
				let diagnostics = validate("fROm busybox", { instructionCasing: ValidationSeverity.ERROR });
				assert.equal(diagnostics.length, 1);
				assertInstructionCasing(diagnostics[0], DiagnosticSeverity.Error, 0, 0, 0, 4);
			});
		});
	}

	describe("instruction", function() {
		createUppercaseStyleTest(false);

		describe("extra argument", function() {
			function testExtraArgument(prefix: string, assertDiagnostic: Function) {
				let length = prefix.length;
				let diagnostics = validate("FROM node\n" + prefix + " extra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\r");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra ");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\t");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " extra\n");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 1, length + 1, 1, length + 6);

				diagnostics = validate("FROM node\n" + prefix + " \\\nextra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 2, 0, 2, 5);

				diagnostics = validate("FROM node\n" + prefix + " \\\r\nextra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 2, 0, 2, 5);

				diagnostics = validate("FROM node\n" + prefix + " \\\r\nextra");
				assert.equal(diagnostics.length, 1);
				assertDiagnostic(diagnostics[0], 2, 0, 2, 5);
			}

			it("FROM", function() {
				testExtraArgument("FROM node", assertInstructionRequiresOneOrThreeArguments);
			});

			it("STOPSIGNAL", function() {
				testExtraArgument("STOPSIGNAL SIGTERM", assertInstructionExtraArgument);
			});
		});

		describe("missing argument", function() {
			function testMissingArgument(instruction: string, prefix: string, middle: string, suffix: string, safe?: boolean, assertFunction?: Function) {
				var length = instruction.length;
				let diagnostics = validate("FROM node\n" + instruction + prefix + middle + suffix);
				if (safe) {
					assert.equal(diagnostics.length, 0);
				} else if (assertFunction) {
					assert.equal(diagnostics.length, 1);
					assertFunction(diagnostics[0], 1, 0, 1, length);
				} else {
					assert.equal(diagnostics.length, 1);
					assertInstructionMissingArgument(diagnostics[0], 1, 0, 1, length);
				}
			}

			function testMissingArgumentLoop(instruction: string, safe?: boolean, assertFunction?: Function) {
				let newlines = [ "", "\r", "\n", "\r\n", "\\\r", "\\\n", "\\\r\n" ];
				for (let newline of newlines) {
					testMissingArgument(instruction, "", newline, "", safe, assertFunction);
					testMissingArgument(instruction, "", newline, " ", safe, assertFunction);
					testMissingArgument(instruction, " ", newline, "", safe, assertFunction);
					testMissingArgument(instruction, " ", newline, " ", safe, assertFunction);
					testMissingArgument(instruction, "", newline, "\t", safe, assertFunction);
					testMissingArgument(instruction, "\t", newline, "", safe, assertFunction);
					testMissingArgument(instruction, "\t", newline, "\t", safe, assertFunction);
				}
			}

			it("ADD", function() {
				return testMissingArgumentLoop("ADD");
			});

			it("ARG", function() {
				return testMissingArgumentLoop("ARG");
			});

			it("CMD", function() {
				return testMissingArgumentLoop("CMD", true);
			});

			it("COPY", function() {
				return testMissingArgumentLoop("COPY", false, assertCOPYRequiresAtLeastTwoArguments);
			});

			it("ENTRYPOINT", function() {
				return testMissingArgumentLoop("ENTRYPOINT");
			});

			it("ENV", function() {
				return testMissingArgumentLoop("ENV");
			});

			it("EXPOSE", function() {
				return testMissingArgumentLoop("EXPOSE");
			});

			it("FROM", function() {
				return testMissingArgumentLoop("FROM");
			});

			it("HEALTHCHECK", function() {
				return testMissingArgumentLoop("HEALTHCHECK");
			});

			it("LABEL", function() {
				return testMissingArgumentLoop("LABEL");
			});

			it("MAINTAINER", function() {
				return testMissingArgumentLoop("MAINTAINER");
			});

			it("ONBUILD", function() {
				return testMissingArgumentLoop("ONBUILD");
			});

			it("RUN", function() {
				return testMissingArgumentLoop("RUN");
			});

			it("SHELL", function() {
				return testMissingArgumentLoop("SHELL");
			});

			it("STOPSIGNAL", function() {
				return testMissingArgumentLoop("STOPSIGNAL");
			});

			it("USER", function() {
				return testMissingArgumentLoop("USER");
			});

			it("WORKDIR", function() {
				return testMissingArgumentLoop("WORKDIR");
			});
		});

		describe("escaped instruction", function() {
			function testEscapedInstruction(instructionPrefix: string, middle: string, instructionSuffix: string, args: string) {
				let diagnostics = validate("FROM node\n" + instructionPrefix + middle + instructionSuffix + " " + args);
				assert.equal(diagnostics.length, 0);
			}

			function testEscapedInstructionLoop(instruction: string, args: string) {
				let newlines = [ "\\\n", "\\\r", "\\\r\n", "\\ \n", "\\ \r", "\\ \r\n", "\\\t\n", "\\\t\r", "\\\t\r\n" ];
				for (let newline of newlines) {
					testEscapedInstruction(instruction.substring(0, 1), newline, instruction.substring(1), args);
				}
			}

			it("ADD", function() {
				testEscapedInstructionLoop("ADD", "source dest");
			});

			it("ARG", function() {
				testEscapedInstructionLoop("ARG", "name");
			});

			it("CMD", function() {
				testEscapedInstructionLoop("CMD", "[ \"/bin/ls\" ]");
			});

			it("COPY", function() {
				testEscapedInstructionLoop("COPY", "source dest");
			});

			it("ENTRYPOINT", function() {
				testEscapedInstructionLoop("ENTRYPOINT", "[ \"/usr/bin/sh\" ]");
			});

			it("ENV", function() {
				testEscapedInstructionLoop("ENV", "key=value");
			});

			it("EXPOSE", function() {
				testEscapedInstructionLoop("EXPOSE", "8080");
			});

			it("FROM", function() {
				testEscapedInstructionLoop("FROM", "node");
			});

			it("HEALTHCHECK", function() {
				testEscapedInstructionLoop("HEALTHCHECK", "NONE");
			});

			it("LABEL", function() {
				testEscapedInstructionLoop("LABEL", "key=value");
			});

			it("MAINTAINER", function() {
				testEscapedInstructionLoop("MAINTAINER", "authorName");
			});

			it("ONBUILD", function() {
				testEscapedInstructionLoop("ONBUILD", "HEALTHCHECK NONE");
			});

			it("RUN", function() {
				testEscapedInstructionLoop("RUN", "apt-get update");
			});

			it("SHELL", function() {
				testEscapedInstructionLoop("SHELL", "[ \"powershell\" ]");
			});

			it("STOPSIGNAL", function() {
				testEscapedInstructionLoop("STOPSIGNAL", "9");
			});

			it("USER", function() {
				testEscapedInstructionLoop("USER", "daemon");
			});

			it("VOLUME", function() {
				testEscapedInstructionLoop("VOLUME", "[ \"/data\" ]");
			});

			it("WORKDIR", function() {
				testEscapedInstructionLoop("WORKDIR", "/path");
			});
		});

		describe("multiples", function() {
			function createMutiplesTest(instruction: string, args: string, settingsName: string) {
				let line = instruction + " " + args;
				let content = "FROM busybox\n" + line + "\n" + line;
				let instructionLength = instruction.length;

				it("default", function() {
					let validator = new Validator();
					let diagnostics = validator.validate(KEYWORDS, createDocument(content));
					assert.equal(diagnostics.length, 2);
					assertInstructionMultiple(diagnostics[0], DiagnosticSeverity.Warning, instruction, 1, 0, 1, instructionLength);
					assertInstructionMultiple(diagnostics[1], DiagnosticSeverity.Warning, instruction, 2, 0, 2, instructionLength);
				});

				it("ignore", function() {
					let settings = {};
					settings[settingsName] = ValidationSeverity.IGNORE;
					let diagnostics = validate(content, settings);
					assert.equal(diagnostics.length, 0);
				});

				it("warning", function() {
					let settings = {};
					settings[settingsName] = ValidationSeverity.WARNING;
					let diagnostics = validate(content, settings);
					assert.equal(diagnostics.length, 2);
					assertInstructionMultiple(diagnostics[0], DiagnosticSeverity.Warning, instruction, 1, 0, 1, instructionLength);
					assertInstructionMultiple(diagnostics[1], DiagnosticSeverity.Warning, instruction, 2, 0, 2, instructionLength);
				});

				it("error", function() {
					let settings = {};
					settings[settingsName] = ValidationSeverity.ERROR;
					let diagnostics = validate(content, settings);
					assert.equal(diagnostics.length, 2);
					assertInstructionMultiple(diagnostics[0], DiagnosticSeverity.Error, instruction, 1, 0, 1, instructionLength);
					assertInstructionMultiple(diagnostics[1], DiagnosticSeverity.Error, instruction, 2, 0, 2, instructionLength);
				});
			};

			describe("CMD", function() {
				createMutiplesTest("CMD", "ls", "instructionCmdMultiple");
			});

			describe("ENTRYPOINT", function() {
				createMutiplesTest("ENTRYPOINT", "ls", "instructionEntrypointMultiple");
			});

			describe("HEALTHCHECK", function() {
				createMutiplesTest("HEALTHCHECK", "NONE", "instructionHealthcheckMultiple");
			});
		});

		describe("unknown", function () {
			it("simple", function () {
				let diagnostics = validate("FROM node\nRUNCMD docker");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);

				diagnostics = validate("FROM node\nRUNCMD docker\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);

				diagnostics = validate("FROM node\nRUNCMD docker\r\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);

				diagnostics = validate("FROM node\nRUNCMD docker\\\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);

				diagnostics = validate("FROM node\nR\\UN docker\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "R\\UN", 1, 0, 1, 4);
			});

			it("escape", function () {
				let diagnostics = validate("FROM node\nSTOPSIGNAL\\\n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\\n9 ");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\\r\n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\\r\n9 ");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\ \n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\ \t\n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\  \n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\ \r\n9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM node\nSTOPSIGNAL\\ \r9");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "STOPSIGNAL9", 1, 0, 2, 1);

				diagnostics = validate("FROM alpine\nEXPOS\\8080");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "EXPOS\\8080", 1, 0, 1, 10);

				diagnostics = validate("FROM alpine\nEXPOS\\ 8080");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "EXPOS\\", 1, 0, 1, 6);

				diagnostics = validate("FROM alpine\nEXPOS\\  8080");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "EXPOS\\", 1, 0, 1, 6);

				diagnostics = validate("\\FROM node");
				assert.equal(diagnostics.length, 2);
				assertDiagnostics(diagnostics,
					[ ValidationCode.UNKNOWN_INSTRUCTION, ValidationCode.NO_SOURCE_IMAGE ],
					[ assertInstructionUnknown, assertNoSourceImage ],
					[ [ "\\FROM", 0, 0, 0, 5 ], [ 0, 0, 0, 5 ] ]);
			});

			/**
			 * Checks that an unknown instruction that is written in lowercase only
			 * receives one error about the unknown instruction.
			 */
			it("does not overlap with casing", function () {
				let diagnostics = validate("FROM node\nruncmd docker");
				assert.equal(diagnostics.length, 1);
				assertInstructionUnknown(diagnostics[0], "RUNCMD", 1, 0, 1, 6);
			});
		});

		describe("first instruction not FROM", function() {
			it("one line", function() {
				let diagnostics = validate("EXPOSE 8080");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 6);
			});

			it("two lines", function() {
				let diagnostics = validate("EXPOSE 8080\n# another line");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 6);
			});

			it("two instructions", function() {
				let diagnostics = validate("EXPOSE 8080\nEXPOSE 8081");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 6);
			});

			it("comments ignored", function() {
				let diagnostics = validate("# FROM node\nEXPOSE 8080");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 1, 0, 1, 6);
			});
		});

		describe("ARG before FROM", function() {
			it("single", function() {
				let diagnostics = validate("ARG x\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("double", function() {
				let diagnostics = validate("ARG x\nARG y\nFROM node");
				assert.equal(diagnostics.length, 0);
			});
		});

		describe("ARG before EXPOSE", function() {
			it("invalid", function() {
				let diagnostics = validate("ARG x\nEXPOSE 8080");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 1, 0, 1, 6);
			});
		});

		describe("ARG only", function() {
			it("invalid", function() {
				let diagnostics = validate("ARG x\nARG y\nARG z");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
			});
		});
	});

	describe("directives", function() {
		describe("unknown directive", function() {
			it("simple", function() {
				let diagnostics = validate("# key=value\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("simple EOF", function() {
				let diagnostics = validate("# key=value");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
			});

			it("whitespace", function() {
				let diagnostics = validate("# key = value\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("ignored after one comment", function() {
				let diagnostics = validate("# This is a comment\n# key=value\nFROM node");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("#\r# key=value\nFROM node");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("#\r# key=value\rFROM node");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("#=# key=value\nFROM node");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("#=# key=value\r\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("ignored after one instruction", function() {
				let diagnostics = validate("FROM node\n# key=value");
				assert.equal(diagnostics.length, 0);
			});
		});

		describe("escape validation", function() {
			it("backtick", function() {
				let diagnostics = validate("# escape=`\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("whitespace around the value", function() {
				let diagnostics = validate("# escape =  `  \nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("invalid escape directive", function() {
				let diagnostics = validate("# escape=ab\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], "ab", 0, 9, 0, 11);

				diagnostics = validate("# escape=ab\r\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], "ab", 0, 9, 0, 11);
			});

			it("value set to whitespace", function() {
				let diagnostics = validate("#escape= \nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], " ", 0, 8, 0, 9);
				
				diagnostics = validate("#escape=\t\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveEscapeInvalid(diagnostics[0], "\t", 0, 8, 0, 9);
			});

			it("EOF", function() {
				let diagnostics = validate("#escape=");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
			});

			it("EOF newline", function() {
				let diagnostics = validate("#escape=\n");
				assert.equal(diagnostics.length, 1);
				assertNoSourceImage(diagnostics[0], 0, 0, 0, 0);
			});

			it("ignored on second line", function() {
				let diagnostics = validate("\n# escape=a\nFROM node");
				assert.equal(diagnostics.length, 0);
			});
		});

		describe("escape casing", function() {
			it("lowercase", function() {
				let diagnostics = validate("# escape=`\nFROM node");
				assert.equal(diagnostics.length, 0);
			});

			it("mixed", function() {
				let diagnostics = validate("# esCAPe=`\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveCasing(diagnostics[0], DiagnosticSeverity.Warning, 0, 2, 0, 8);
			});

			it("uppercase", function() {
				let diagnostics = validate("# ESCAPE=`\nFROM node");
				assert.equal(diagnostics.length, 1);
				assertDirectiveCasing(diagnostics[0], DiagnosticSeverity.Warning, 0, 2, 0, 8);
			});

			it("default", function() {
				let validator = new Validator();
				let diagnostics = validator.validate(KEYWORDS, createDocument("# esCAPe=`\nFROM node"));
				assert.equal(diagnostics.length, 1);
				assertDirectiveCasing(diagnostics[0], DiagnosticSeverity.Warning, 0, 2, 0, 8);
			});

			it("ignore", function() {
				let diagnostics = validate("# esCAPe=`\nFROM node", { directiveCasing: ValidationSeverity.IGNORE });
				assert.equal(diagnostics.length, 0);
			});

			it("warning", function() {
				let diagnostics = validate("# esCAPe=`\nFROM node", { directiveCasing: ValidationSeverity.WARNING });
				assert.equal(diagnostics.length, 1);
				assertDirectiveCasing(diagnostics[0], DiagnosticSeverity.Warning, 0, 2, 0, 8);
			});

			it("error", function() {
				let diagnostics = validate("# esCAPe=`\nFROM node", { directiveCasing: ValidationSeverity.ERROR });
				assert.equal(diagnostics.length, 1);
				assertDirectiveCasing(diagnostics[0], DiagnosticSeverity.Error, 0, 2, 0, 8);
			});

			it("ignored on second line", function() {
				let diagnostics = validate("\n# esCAPe=a\nFROM node");
				assert.equal(diagnostics.length, 0);
			});
		});
	});

	describe("ARG", function() {
		it("ok", function() {
			testValidArgument("ARG", "a=b");
			testValidArgument("ARG", "a=\"a b\"");
			testValidArgument("ARG", "a='a b'");
		});

		it("escape", function() {
			testValidArgument("ARG", "a=a\\ x");
			testValidArgument("ARG", "a=a\\");
			testValidArgument("ARG", "a=a\\b");
			testValidArgument("ARG", "a=a\\\\b");
			testValidArgument("ARG", "a=\"a\\ x\"");
			testValidArgument("ARG", "a='a\\ x'");
			testValidArgument("ARG", "a=a\\\nx");
			testValidArgument("ARG", "a=a\\ \nx");
			testValidArgument("ARG", "a=a\\\rx");
			testValidArgument("ARG", "a=a\\ \rx");
			testValidArgument("ARG", "a=a\\\r\nx");
			testValidArgument("ARG", "a=a\\ \r\nx");
			testValidArgument("ARG", "a=\"a \\\nx\"");
			testValidArgument("ARG", "a=\"a \\\rx\"");
			testValidArgument("ARG", "a=\"a \\\r\nx\"");
			testValidArgument("ARG", "a=\'a \\\nx'");
			testValidArgument("ARG", "a=\'a \\\rx'");
			testValidArgument("ARG", "a=\'a \\\r\nx'");
		});

		it("invalid", function() {
			let diagnostics = validate("FROM busybox\nARG a=a b");
			assert.equal(diagnostics.length, 1);
			assertInstructionRequiresOneArgument(diagnostics[0], 1, 8, 1, 9);

			diagnostics = validate("FROM busybox\nARG a=a\\  b");
			assert.equal(diagnostics.length, 1);
			assertInstructionRequiresOneArgument(diagnostics[0], 1, 10, 1, 11);

			diagnostics = validate("FROM busybox\nARG a=a\\\\ b");
			assert.equal(diagnostics.length, 1);
			assertInstructionRequiresOneArgument(diagnostics[0], 1, 10, 1, 11);

			diagnostics = validate("FROM busybox\nARG a=a\\\n b");
			assert.equal(diagnostics.length, 1);
			assertInstructionRequiresOneArgument(diagnostics[0], 2, 1, 2, 2);

			diagnostics = validate("FROM busybox\nARG a=a\\\r b");
			assert.equal(diagnostics.length, 1);
			assertInstructionRequiresOneArgument(diagnostics[0], 2, 1, 2, 2);

			diagnostics = validate("FROM busybox\nARG a=a\\\r\n b");
			assert.equal(diagnostics.length, 1);
			assertInstructionRequiresOneArgument(diagnostics[0], 2, 1, 2, 2);

			diagnostics = validate("FROM busybox\nARG a=a\\ \\b \\c");
			assert.equal(diagnostics.length, 1);
			assertInstructionRequiresOneArgument(diagnostics[0], 1, 12, 1, 14);
		});
	});

	describe("COPY", function() {
		describe("arguments", function() {
			it("ok", function() {
				let diagnostics = validate("FROM alpine\nCOPY . .");
				assert.equal(diagnostics.length, 0);
			});

			it("requires at least two", function() {
				let diagnostics = validate("FROM alpine\nCOPY ");
				assert.equal(diagnostics.length, 1);
				assertCOPYRequiresAtLeastTwoArguments(diagnostics[0], 1, 0, 1, 4);

				diagnostics = validate("FROM alpine\nCOPY .");
				assert.equal(diagnostics.length, 1);
				assertCOPYRequiresAtLeastTwoArguments(diagnostics[0], 1, 5, 1, 6);

				diagnostics = validate("FROM alpine\nCOPY --from=busybox");
				assert.equal(diagnostics.length, 1);
				assertCOPYRequiresAtLeastTwoArguments(diagnostics[0], 1, 0, 1, 4);

				diagnostics = validate("FROM alpine\nCOPY --from=busybox .");
				assert.equal(diagnostics.length, 1);
				assertCOPYRequiresAtLeastTwoArguments(diagnostics[0], 1, 20, 1, 21);
			});
		});

		describe("build stages", function() {
			it("ok", function() {
				let diagnostics = validate("FROM alpine\nFROM busybox AS bb\nCOPY --from=bb . .");
				assert.equal(diagnostics.length, 0);
			});

			it("unknown flag", function() {
				let diagnostics = validate("FROM alpine\nFROM busybox AS bb\nCOPY --x=bb . .");
				assert.equal(diagnostics.length, 1);
				assertFlagUnknown(diagnostics[0], "x", 2, 7, 2, 8);

				// empty value
				diagnostics = validate("FROM alpine\nFROM busybox AS bb\nCOPY --x= . .");
				assert.equal(diagnostics.length, 1);
				assertFlagUnknown(diagnostics[0], "x", 2, 7, 2, 8);

				// no equals sign
				diagnostics = validate("FROM alpine\nFROM busybox AS bb\nCOPY --x . .");
				assert.equal(diagnostics.length, 1);
				assertFlagUnknown(diagnostics[0], "x", 2, 7, 2, 8);

				// flags are case-sensitive
				diagnostics = validate("FROM alpine\nFROM busybox AS bb\nCOPY --FROM=bb . .");
				assert.equal(diagnostics.length, 1);
				assertFlagUnknown(diagnostics[0], "FROM", 2, 7, 2, 11);
			});

			it("flag no value", function() {
				let diagnostics = validate("FROM alpine\nCOPY --from . .");
				assert.equal(diagnostics.length, 1);
				assertFlagMissingValue(diagnostics[0], "from", 1, 7, 1, 11);
			});

			it("duplicate flag", function() {
				let diagnostics = validate("FROM alpine\nCOPY --from=x --from=y . .");
				assert.equal(diagnostics.length, 2);
				assertFlagDuplicate(diagnostics[0], "from", 1, 7, 1, 11);
				assertFlagDuplicate(diagnostics[1], "from", 1, 16, 1, 20);
			});
		});
	});

	function createNameValuePairTests(instruction: string) {
		let instructionLength = instruction.length;

		describe(instruction, function() {
			it("ok", function() {
				// valid as the variable is equal to the empty string in this case
				testValidArgument(instruction, "a=");
				testValidArgument(instruction, "a=b");

				let diagnostics = validate("FROM node\n" + instruction + " a b");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " a='\\'");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " a='\\\\'");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " var='a\\\nb'");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " var='a\\ \nb'");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " var=\"a\\\nb\"");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " var=\"a\\ \nb\"");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " var=\"\\\"\\\"\"");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " x=y \\\n# abc \na=b");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " x=y \\\n# abc \r\na=b");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " var=value \\\n# comment\n# comment\nvar2=value2");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node\n" + instruction + " var=value \\\n# var2=value2");
				assert.equal(diagnostics.length, 0);
			});

			it("requires two", function() {
				let diagnostics = validate("FROM node\n" + instruction + " a");
				assert.equal(diagnostics.length, 1);
				assertENVRequiresTwoArguments(diagnostics[0], 1, instructionLength + 1, 1, instructionLength + 2);
			});

			it("syntax missing equals", function() {
				let diagnostics = validate("FROM node\n" + instruction + " a=b c");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingEquals(diagnostics[0], "c", 1, instructionLength + 5, 1, instructionLength + 6);
				
				diagnostics = validate("FROM node\n" + instruction + " a=b c d=e");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingEquals(diagnostics[0], "c", 1, instructionLength + 5, 1, instructionLength + 6);
			});

			it("syntax missing single quote", function() {
				let diagnostics = validate("FROM node\n" + instruction + " var='value");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingSingleQuote(diagnostics[0], "'value", 1, instructionLength + 5, 1, instructionLength + 11);

				diagnostics = validate("FROM node\n" + instruction + " var='val\\\nue");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingSingleQuote(diagnostics[0], "'value", 1, instructionLength + 5, 2, 2);
			});

			it("syntax missing double quote", function() {
				let diagnostics = validate("FROM node\n" + instruction + " var=\"value");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"value", 1, instructionLength + 5, 1, instructionLength + 11);

				diagnostics = validate("FROM node\n" + instruction + " var=\"value\\");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"value\\", 1, instructionLength + 5, 1, instructionLength + 12);

				diagnostics = validate("FROM node\n" + instruction + " var=\"value\\\"");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"value\\\"", 1, instructionLength + 5, 1, instructionLength + 13);

				diagnostics = validate("FROM node\n" + instruction + " var=\"a\\  ");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"a\\", 1, instructionLength + 5, 1, instructionLength + 8);

				diagnostics = validate("FROM node\n" + instruction + " var=\"a\\  b");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"a\\  b", 1, instructionLength + 5, 1, instructionLength + 11);

				diagnostics = validate("FROM node\n" + instruction + " var=\"val\\\nue");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"value", 1, instructionLength + 5, 2, 2);

				diagnostics = validate("FROM node\n" + instruction + " var=\"val\\\rue");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"value", 1, instructionLength + 5, 2, 2);

				diagnostics = validate("FROM node\n" + instruction + " var=\"val\\\r\nue");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingDoubleQuote(diagnostics[0], "\"value", 1, instructionLength + 5, 2, 2);
			});

			it("missing name", function() {
				let diagnostics = validate("FROM node\n" + instruction + " =value");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingNames(diagnostics[0], instruction, 1, instructionLength + 1, 1, instructionLength + 7);

				diagnostics = validate("FROM node\n" + instruction + " =");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingNames(diagnostics[0], instruction, 1, instructionLength + 1, 1, instructionLength + 2);

				diagnostics = validate("FROM node\n" + instruction + " x=y =z a=b");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingNames(diagnostics[0], instruction, 1, instructionLength + 5, 1, instructionLength + 7);

				diagnostics = validate("FROM node\n" + instruction + " x=y = a=b");
				assert.equal(diagnostics.length, 1);
				assertSyntaxMissingNames(diagnostics[0], instruction, 1, instructionLength + 5, 1, instructionLength + 6);
			});
		});
	}

	createNameValuePairTests("ENV");

	describe("EXPOSE", function() {
		it("ok", function() {
			testValidArgument("EXPOSE", "8080");
			testValidArgument("EXPOSE", "80\\80");
			testValidArgument("EXPOSE", "7000-8000");
			testValidArgument("EXPOSE", "8080/tcp");
			testValidArgument("EXPOSE", "8080/TcP");
			testValidArgument("EXPOSE", "8080/udp");
			testValidArgument("EXPOSE", "8080/uDp");
			testValidArgument("EXPOSE", "8080:8080");
			testValidArgument("EXPOSE", "8080:8080/tcp");
			// unspecified protocol is assumed to be TCP
			testValidArgument("EXPOSE", "8080/");
			// Docker engine does not flag such arguments as errors
			testValidArgument("EXPOSE", "8080/tcp/tcpx/tcptx/sdfsdfasdf/asdf/asdf/adf");
			testValidArgument("EXPOSE", "8080:888/tcp/123");
		});

		it("escape", function() {
			let diagnostics = validate("FROM node\nEXPOSE 8080\\\n8081");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8080\\\r\n8081");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8080 \\\n8081");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n8080");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n 8080");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n8080\n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n 8080\n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n8080 \n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\\n 8080 \n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8080\\\n");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 80\\\n80");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000-\\\n9000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000\\\n-9000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 80\\\r\n80");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000-\\\r\n9000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000\\\r\n-9000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE \\ 8000");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nEXPOSE 8000\\ 8001");
			assert.equal(diagnostics.length, 0);
		});

		it("invalid containerPort", function() {
			let diagnostics = validate("FROM node\nEXPOSE a");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\r");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\r\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\\\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE ab\\\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "ab", 1, 7, 1, 9);

			diagnostics = validate("FROM node\nEXPOSE a\r");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\\\r ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE ab\\\r ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "ab", 1, 7, 1, 9);

			diagnostics = validate("FROM node\nEXPOSE a\r\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE a\\\r\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE ab\\\r\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "ab", 1, 7, 1, 9);

			diagnostics = validate("FROM node\nEXPOSE -8000");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE -8000 ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE -8000\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE -8000\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-8000", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000-");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000- ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000-\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 8000-\n ");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 1, 12);

			diagnostics = validate("FROM node\nEXPOSE 80\\\n00-\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 2, 3);

			diagnostics = validate("FROM node\nEXPOSE 80\\\n00-");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8000-", 1, 7, 2, 3);

			diagnostics = validate("FROM node\nEXPOSE -");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "-", 1, 7, 1, 8);

			diagnostics = validate("FROM node\nEXPOSE \\a");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "a", 1, 7, 1, 9);

			diagnostics = validate("FROM node\nEXPOSE 8080::8089");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8080::8089", 1, 7, 1, 17);

			diagnostics = validate("FROM node\nEXPOSE 8080--8089");
			assert.equal(diagnostics.length, 1);
			assertInvalidPort(diagnostics[0], "8080--8089", 1, 7, 1, 17);
		});

		it("invalid proto", function() {
			let diagnostics = validate("FROM node\nEXPOSE 8080/tcpx");
			assert.equal(diagnostics.length, 1);
			assertInvalidProto(diagnostics[0], "tcpx", 1, 12, 1, 16);

			diagnostics = validate("FROM node\nEXPOSE 8080/TCPs");
			assert.equal(diagnostics.length, 1);
			assertInvalidProto(diagnostics[0], "TCPs", 1, 12, 1, 16);

			diagnostics = validate("FROM node\nEXPOSE 8080-8081:8082-8083/udpy");
			assert.equal(diagnostics.length, 1);
			assertInvalidProto(diagnostics[0], "udpy", 1, 27, 1, 31);

			diagnostics = validate("FROM node\nEXPOSE 8080/x");
			assert.equal(diagnostics.length, 1);
			assertInvalidProto(diagnostics[0], "x", 1, 12, 1, 13);
		});
	});

	describe("FROM", function() {
		describe("source image", function() {
			it("ok", function() {
				let diagnostics = validate("FROM node");
				assert.equal(diagnostics.length, 0);
			});
		});

		describe("build stage", function() {
			it("ok", function() {
				let diagnostics = validate("FROM node AS setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node As setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node aS setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node as setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node AS \\ \n setup");
				assert.equal(diagnostics.length, 0);

				diagnostics = validate("FROM node AS a_lpi-n.e99");
				assert.equal(diagnostics.length, 0);
			});

			it("invalid as", function() {
				let diagnostics = validate("FROM node A$ setup");
				assert.equal(diagnostics.length, 1);
				assertInvalidAs(diagnostics[0], 0, 10, 0, 12);
			});

			it("duplicate name", function() {
				let diagnostics = validate("FROM node AS setup\nFROM node AS setup");
				assert.equal(diagnostics.length, 2);
				assertDuplicateBuildStageName(diagnostics[0], "setup", 0, 13, 0, 18);
				assertDuplicateBuildStageName(diagnostics[1], "setup", 1, 13, 1, 18);

				diagnostics = validate("FROM node AS setup\nFROM node AS setUP");
				assert.equal(diagnostics.length, 2);
				assertDuplicateBuildStageName(diagnostics[0], "setup", 0, 13, 0, 18);
				assertDuplicateBuildStageName(diagnostics[1], "setup", 1, 13, 1, 18);

				diagnostics = validate("FROM node AS SETUP\nFROM node AS seTUp");
				assert.equal(diagnostics.length, 2);
				assertDuplicateBuildStageName(diagnostics[0], "setup", 0, 13, 0, 18);
				assertDuplicateBuildStageName(diagnostics[1], "setup", 1, 13, 1, 18);
			});

			it("invalid name", function() {
				let diagnostics = validate("FROM node AS 1s");
				assert.equal(diagnostics.length, 1);
				assertInvalidBuildStageName(diagnostics[0], "1s", 0, 13, 0, 15);

				diagnostics = validate("FROM node AS _s");
				assert.equal(diagnostics.length, 1);
				assertInvalidBuildStageName(diagnostics[0], "_s", 0, 13, 0, 15);

				diagnostics = validate("FROM node AS a_lpi-n.e,99");
				assert.equal(diagnostics.length, 1);
				assertInvalidBuildStageName(diagnostics[0], "a_lpi-n.e,99", 0, 13, 0, 25);
			});
		});

		describe("wrong args number", function() {
			it("two", function() {
				let diagnostics = validate("FROM node AS");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 10, 0, 12);

				diagnostics = validate("FROM node As \\\n");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 10, 0, 12);

				diagnostics = validate("FROM node test");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 10, 0, 14);

				diagnostics = validate("from node test");
				assertDiagnostics(diagnostics,
					[ ValidationCode.CASING_INSTRUCTION, ValidationCode.ARGUMENT_REQUIRES_ONE_OR_THREE ],
					[ assertInstructionCasing, assertInstructionRequiresOneOrThreeArguments ],
					[ [ DiagnosticSeverity.Warning, 0, 0, 0, 4 ], [ 0, 10, 0, 14 ] ]);
			});

			it("four", function() {
				let diagnostics = validate("FROM node AS setup again");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 0, 19, 0, 24);

				diagnostics = validate("FROM node As \\\nsetup two");
				assert.equal(diagnostics.length, 1);
				assertInstructionRequiresOneOrThreeArguments(diagnostics[0], 1, 6, 1, 9);
			});
		});
	});

	describe("HEALTHCHECK", function() {
		describe("CMD", function() {
			describe("flags", function() {
				it("ok", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=30s --retries=3 --start-period=5s --timeout=30s CMD ls");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=30s CMD ls");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=3 CMD ls");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --start-period=5s CMD ls");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=30s CMD ls");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=1ms01h1m1s1ms CMD ls");
					assert.equal(diagnostics.length, 0);
				});

				it("unknown flag", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interva=30s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "interva", 1, 14, 1, 21);

					// empty value
					diagnostics = validate("FROM alpine\nHEALTHCHECK --interva= CMD ls");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "interva", 1, 14, 1, 21);

					// no equals sign
					diagnostics = validate("FROM alpine\nHEALTHCHECK --interva CMD ls");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "interva", 1, 14, 1, 21);

					// flags are case-sensitive
					diagnostics = validate("FROM alpine\nHEALTHCHECK --INTERVAL=30s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "INTERVAL", 1, 14, 1, 22);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --RETRIES=3 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "RETRIES", 1, 14, 1, 21);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --START-PERIOD=0s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "START-PERIOD", 1, 14, 1, 26);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --TIMEOUT=30s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "TIMEOUT", 1, 14, 1, 21);
				});

				it("flag no value", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interval CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingValue(diagnostics[0], "interval", 1, 14, 1, 22);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --retries CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingValue(diagnostics[0], "retries", 1, 14, 1, 21);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --start-period CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingValue(diagnostics[0], "start-period", 1, 14, 1, 26);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingValue(diagnostics[0], "timeout", 1, 14, 1, 21);
				});

				it("flags empty value", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interval= --retries= --start-period= --timeout= CMD ls");
					assert.equal(diagnostics.length, 0);
				});

				it("duplicate flag", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=30s --interval=30s CMD ls");
					assert.equal(diagnostics.length, 2);
					assertFlagDuplicate(diagnostics[0], "interval", 1, 14, 1, 22);
					assertFlagDuplicate(diagnostics[1], "interval", 1, 29, 1, 37);
				});

				it("--retries", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=3 CMD ls");
					assert.equal(diagnostics.length, 0);

					// leading zeroes
					diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=001 CMD ls");
					assert.equal(diagnostics.length, 0);
				});

				it("invalid --retries value", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=a CMD ls");
					assert.equal(diagnostics.length, 1);
					assertInvalidSyntax(diagnostics[0], "a", 1, 22, 1, 23);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=1.0 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertInvalidSyntax(diagnostics[0], "1.0", 1, 22, 1, 25);
				});

				it("--retries at least one", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=0 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagAtLeastOne(diagnostics[0], "--retries", "0", 1, 22, 1, 23);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=-1 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagAtLeastOne(diagnostics[0], "--retries", "-1", 1, 22, 1, 24);
				});

				it("CMD no arguments", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK CMD");
					assert.equal(diagnostics.length, 1);
					assertHealthcheckCmdArgumentMissing(diagnostics[0], 1, 12, 1, 15);

					diagnostics = validate("FROM alpine\nHEALTHCHECK CMD ");
					assert.equal(diagnostics.length, 1);
					assertHealthcheckCmdArgumentMissing(diagnostics[0], 1, 12, 1, 15);

					diagnostics = validate("FROM alpine\nHEALTHCHECK CMD \n");
					assert.equal(diagnostics.length, 1);
					assertHealthcheckCmdArgumentMissing(diagnostics[0], 1, 12, 1, 15);

					diagnostics = validate("FROM alpine\nHEALTHCHECK CMD CMD");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK CMD cmd");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK cmd CMD");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK cmd cmd");
					assert.equal(diagnostics.length, 0);
				});

				it("invalid duration", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=a CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagInvalidDuration(diagnostics[0], "a", 1, 23, 1, 24);
					
					diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=a1s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagInvalidDuration(diagnostics[0], "a1s", 1, 23, 1, 26);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --start-period=a CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagInvalidDuration(diagnostics[0], "a", 1, 27, 1, 28);
					
					diagnostics = validate("FROM alpine\nHEALTHCHECK --start-period=a1s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagInvalidDuration(diagnostics[0], "a1s", 1, 27, 1, 30);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=a CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagInvalidDuration(diagnostics[0], "a", 1, 22, 1, 23);
					
					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=a1s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagInvalidDuration(diagnostics[0], "a1s", 1, 22, 1, 25);
				});

				it("missing duration", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=10 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingDuration(diagnostics[0], "10", 1, 23, 1, 25);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=-10 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingDuration(diagnostics[0], "-10", 1, 23, 1, 26);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --start-period=10 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingDuration(diagnostics[0], "10", 1, 27, 1, 29);
					
					diagnostics = validate("FROM alpine\nHEALTHCHECK --start-period=-10 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingDuration(diagnostics[0], "-10", 1, 27, 1, 30);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=10 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingDuration(diagnostics[0], "10", 1, 22, 1, 24);
					
					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=-10 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingDuration(diagnostics[0], "-10", 1, 22, 1, 25);
					
					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=5s5 CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagMissingDuration(diagnostics[0], "5s5", 1, 22, 1, 25);
				});

				it("unknown unit", function() {
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=1x CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagUnknownUnit(diagnostics[0], "x", "1x", 1, 22, 1, 24);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=1s1x CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagUnknownUnit(diagnostics[0], "x", "1s1x", 1, 22, 1, 26);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=1x1s CMD ls");
					assert.equal(diagnostics.length, 1);
					assertFlagUnknownUnit(diagnostics[0], "x", "1x1s", 1, 22, 1, 26);
				});

				function createDurationTooShortTests(flag: string) {
					it(flag + " too short", function() {
						let diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=900ms CMD ls");
						assert.equal(diagnostics.length, 0);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=1s CMD ls");
						assert.equal(diagnostics.length, 0);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=1m CMD ls");
						assert.equal(diagnostics.length, 0);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=1h CMD ls");
						assert.equal(diagnostics.length, 0);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=500us600us CMD ls");
						assert.equal(diagnostics.length, 0);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=500ns600s CMD ls");
						assert.equal(diagnostics.length, 0);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=0s10s CMD ls");
						assert.equal(diagnostics.length, 0);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=0s CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=-1s CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=100us CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=100µs CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=100ns CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=-500ns600s CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=-0s CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);

						diagnostics = validate("FROM alpine\nHEALTHCHECK --" + flag + "=-0s10s CMD ls");
						assert.equal(diagnostics.length, 1);
						assertFlagLessThan1ms(diagnostics[0], flag, 1, 14, 1, 14 + flag.length);
					});
				}

				createDurationTooShortTests("interval");
				createDurationTooShortTests("start-period");
				createDurationTooShortTests("timeout");
			});
		});

		describe("NONE", function() {
			describe("flags", function() {
				it("ok", function() {
					// flags don't make sense for a NONE,
					// but the builder ignores them so we should too
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=30s --retries=3 --start-period=0s --timeout=30s NONE");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --interval=30s NONE");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --retries=3 NONE");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --start-period=0s NONE");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=30s NONE");
					assert.equal(diagnostics.length, 0);

					diagnostics = validate("FROM alpine\nHEALTHCHECK --timeout=20s --timeout=30s NONE");
					assert.equal(diagnostics.length, 0);
				});

				it("argments specified", function() {
					// single argument
					let diagnostics = validate("FROM alpine\nHEALTHCHECK NONE --interval=10s");
					assert.equal(diagnostics.length, 1);
					assertInstructionUnnecessaryArgument(diagnostics[0], "HEALTHCHECK NONE", 1, 17, 1, 31);

					// multiple arguments
					diagnostics = validate("FROM alpine\nHEALTHCHECK NONE a b c");
					assert.equal(diagnostics.length, 1);
					assertInstructionUnnecessaryArgument(diagnostics[0], "HEALTHCHECK NONE", 1, 17, 1, 22);
				});
			});
		});

		describe("unspecified", function() {
			describe("flags", function() {
				it("wrong name", function() {
					// no equals sign
					let diagnostics = validate("FROM alpine\nHEALTHCHECK --interva");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "interva", 1, 14, 1, 21);

					// empty value
					diagnostics = validate("FROM alpine\nHEALTHCHECK --interva=");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "interva", 1, 14, 1, 21);

					// value specified
					diagnostics = validate("FROM alpine\nHEALTHCHECK --interva=30s");
					assert.equal(diagnostics.length, 1);
					assertUnknownHealthcheckFlag(diagnostics[0], "interva", 1, 14, 1, 21);
				});
			});
		});
	});

	createNameValuePairTests("LABEL");

	function createMaintainerTests(trigger: boolean) {
		let onbuild = trigger ? "ONBUILD " : "";
		let onbuildOffset = onbuild.length;

		describe("MAINTAINER", function() {
			it("default", function() {
				let validator = new Validator();
				let diagnostics = validator.validate(KEYWORDS, createDocument("FROM node\n" + onbuild + "MAINTAINER author"));
				if (onbuild) {
					assert.equal(diagnostics.length, 2);
					assertDiagnostics(diagnostics,
						[ ValidationCode.ONBUILD_TRIGGER_DISALLOWED, ValidationCode.DEPRECATED_MAINTAINER ],
						[ assertOnbuildTriggerDisallowed, assertDeprecatedMaintainer ],
						[ [ "MAINTAINER", 1, onbuildOffset, 1, onbuildOffset + 10 ],
							[ DiagnosticSeverity.Warning, 1, onbuildOffset, 1, onbuildOffset + 10 ] ]);
				} else {
					assert.equal(diagnostics.length, 1);
					assertDeprecatedMaintainer(diagnostics[0], DiagnosticSeverity.Warning, 1, onbuildOffset, 1, onbuildOffset + 10);
				}
			});

			it("ignore", function() {
				let diagnostics = validate("FROM node\n" + onbuild + "MAINTAINER author", { deprecatedMaintainer: ValidationSeverity.IGNORE });
				if (onbuild) {
					assert.equal(diagnostics.length, 1);
					assertOnbuildTriggerDisallowed(diagnostics[0], "MAINTAINER", 1, onbuildOffset, 1, onbuildOffset + 10);
				} else {
					assert.equal(diagnostics.length, 0);
				}
			});

			it("warning", function() {
				let diagnostics = validate("FROM node\n" + onbuild + "MAINTAINER author", { deprecatedMaintainer: ValidationSeverity.WARNING });
				if (onbuild) {
					assert.equal(diagnostics.length, 2);
					assertDiagnostics(diagnostics,
						[ ValidationCode.ONBUILD_TRIGGER_DISALLOWED, ValidationCode.DEPRECATED_MAINTAINER ],
						[ assertOnbuildTriggerDisallowed, assertDeprecatedMaintainer ],
						[ [ "MAINTAINER", 1, onbuildOffset, 1, onbuildOffset + 10 ],
							[ DiagnosticSeverity.Warning, 1, onbuildOffset, 1, onbuildOffset + 10 ] ]);
				} else {
					assert.equal(diagnostics.length, 1);
					assertDeprecatedMaintainer(diagnostics[0], DiagnosticSeverity.Warning, 1, onbuildOffset, 1, onbuildOffset + 10);
				}
			});

			it("error", function() {
				let diagnostics = validate("FROM node\n" + onbuild + "MAINTAINER author", { deprecatedMaintainer: ValidationSeverity.ERROR });
				if (onbuild) {
					assert.equal(diagnostics.length, 2);
					assertDiagnostics(diagnostics,
						[ ValidationCode.ONBUILD_TRIGGER_DISALLOWED, ValidationCode.DEPRECATED_MAINTAINER ],
						[ assertOnbuildTriggerDisallowed, assertDeprecatedMaintainer ],
						[ [ "MAINTAINER", 1, onbuildOffset, 1, onbuildOffset + 10 ],
							[ DiagnosticSeverity.Error, 1, onbuildOffset, 1, onbuildOffset + 10 ] ]);
				} else {
					assert.equal(diagnostics.length, 1);
					assertDeprecatedMaintainer(diagnostics[0], DiagnosticSeverity.Error, 1, onbuildOffset, 1, onbuildOffset + 10);
				}
			});
		});
	}

	createMaintainerTests(false);

	describe("ONBUILD", function() {
		createUppercaseStyleTest(true);
		createMaintainerTests(true);

		describe("invalid triggers", function() {
			it("ONBUILD FROM", function() {
				let diagnostics = validate("FROM alpine\nONBUILD FROM alpine");
				assert.equal(diagnostics.length, 1);
				assertOnbuildTriggerDisallowed(diagnostics[0], "FROM", 1, 8, 1, 12);

				diagnostics = validate("FROM alpine\nONBUILD from alpine", { instructionCasing: ValidationSeverity.IGNORE });
				assert.equal(diagnostics.length, 1);
				assertOnbuildTriggerDisallowed(diagnostics[0], "FROM", 1, 8, 1, 12);
			});

			it("ONBUILD MAINTAINER", function() {
				let diagnostics = validate("FROM alpine\nONBUILD MAINTAINER user");
				assert.equal(diagnostics.length, 1);
				assertOnbuildTriggerDisallowed(diagnostics[0], "MAINTAINER", 1, 8, 1, 18);

				diagnostics = validate("FROM alpine\nONBUILD maintainer user", { instructionCasing: ValidationSeverity.IGNORE });
				assert.equal(diagnostics.length, 1);
				assertOnbuildTriggerDisallowed(diagnostics[0], "MAINTAINER", 1, 8, 1, 18);
			});

			it("ONBUILD ONBUILD", function() {
				let diagnostics = validate("FROM alpine\nONBUILD ONBUILD ENV x=y");
				assert.equal(diagnostics.length, 1);
				assertOnbuildChainingDisallowed(diagnostics[0], 1, 8, 1, 15);

				diagnostics = validate("FROM alpine\nONBUILD onbuild ENV x=y", { instructionCasing: ValidationSeverity.IGNORE });
				assert.equal(diagnostics.length, 1);
				assertOnbuildChainingDisallowed(diagnostics[0], 1, 8, 1, 15);
			});
		});
	});

	describe("RUN", function() {
		it("empty newline escape", function() {
			let diagnostics = validate("FROM busybox\nRUN ls && \\\n\nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\rRUN ls && \\\r\rls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n\r\nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n");
			assert.equal(diagnostics.length, 0);
		});

		it("whitespace newline escape", function() {
			let diagnostics = validate("FROM busybox\nRUN ls && \\\n \t \nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\rRUN ls && \\\r \t \rls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n \t \r\nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n \t ");
			assert.equal(diagnostics.length, 0);
		});

		it("comment escape", function() {
			let diagnostics = validate("FROM busybox\nRUN ls && \\\n# comment\nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\rRUN ls && \\\r# comment\rls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n# comment\r\nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n# comment");
			assert.equal(diagnostics.length, 0);
		});

		it("whitespace comment escape", function() {
			let diagnostics = validate("FROM busybox\nRUN ls && \\\n \t# comment\nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\rRUN ls && \\\r \t# comment\rls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n \t# comment\r\nls");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\r\nRUN ls && \\\r\n \t# comment");
			assert.equal(diagnostics.length, 0);
		});
	});

	describe("SHELL", function() {
		it("ok", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\", \"-c\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [\"a,b\"]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a,b\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\b\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\", \\\n \"-c\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\", \\\r \"-c\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\", \\\r\n \"-c\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\", \\ \t\n \"-c\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\\"\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\\nb\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\\n b\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\\n  b\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\\t \n  b\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\ \t\r  b\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"a\\ \t\r\n  b\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"[\" ]");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nSHELL [ \"\\\\[\" ]");
			assert.equal(diagnostics.length, 0);
		});

		it("invalid escape", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"a\\ b\" ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 16);
		});

		it("missing starting [", function() {
			let diagnostics = validate("FROM busybox\nSHELL \"/bin/sh\" ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 17);
		});

		it("double starting [", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ [ \"/bin/sh\" ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 21);
		});

		it("missing starting \"", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ /bin/sh\" ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 18);
		});

		it("missing ending \"", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 18);
		});

		it("missing ending ]", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\"");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 17);
		});

		it("double ending ]", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\" ] ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 21);
		});

		it("comma with EOF", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\",");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 18);
		});

		it("comma with EOL", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\",\n");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 18);
		});

		it("comma without first argument", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ ,\"/bin/sh\" ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 20);
		});

		it("comma without second argument", function() {
			let diagnostics = validate("FROM busybox\nSHELL [ \"/bin/sh\", ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 1, 6, 1, 20);
		});

		it("backtick escape directive ignored", function() {
			let diagnostics = validate("#escape=`\nFROM busybox\nSHELL [ \"a`\"\" ]");
			assert.equal(diagnostics.length, 1);
			assertShellJsonForm(diagnostics[0], 2, 6, 2, 15);
		});

		it("requires at least one argument", function() {
			let diagnostics = validate("FROM busybox\nSHELL []");
			assert.equal(diagnostics.length, 1);
			assertShellRequiresOne(diagnostics[0], 1, 6, 1, 8);

			diagnostics = validate("FROM busybox\nSHELL [ ]");
			assert.equal(diagnostics.length, 1);
			assertShellRequiresOne(diagnostics[0], 1, 6, 1, 9);

			diagnostics = validate("FROM busybox\nSHELL [ \\\n ]");
			assert.equal(diagnostics.length, 1);
			assertShellRequiresOne(diagnostics[0], 1, 6, 2, 2);
		});
	});

	describe("STOPSIGNAL", function() {
		it("ok", function() {
			testValidArgument("STOPSIGNAL", "9");
			testValidArgument("STOPSIGNAL", "SIGKILL");

			let diagnostics = validate("FROM busybox\nARG x\nSTOPSIGNAL $x");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nARG x\nSTOPSIGNAL ${x}");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nARG x\nSTOPSIGNAL s$x");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM busybox\nARG x\nSTOPSIGNAL s${x}");
			assert.equal(diagnostics.length, 0);
		});

		it("escape", function() {
			let diagnostics = validate("FROM node\nSTOPSIGNAL \\\n9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL \\\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL\\\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL \\\r\n9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL\\\r\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL \\\r\n 9");
			assert.equal(diagnostics.length, 0);

			diagnostics = validate("FROM node\nSTOPSIGNAL 9\\\n");
			assert.equal(diagnostics.length, 0);

			testEscape("STOPSIGNAL", "SI", "GKILL");
			testEscape("STOPSIGNAL", "SIGK", "ILL");
		});

		it("invalid stop signal", function() {
			let diagnostics = validate("FROM node\nSTOPSIGNAL a");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a ");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a\n");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);

			diagnostics = validate("FROM node\nSTOPSIGNAL a\r");
			assert.equal(diagnostics.length, 1);
			assertInvalidStopSignal(diagnostics[0], "a", 1, 11, 1, 12);
		});
	});

	describe("USER", function() {
		it("ok", function() {
			return testValidArgument("USER", "daemon");
		});

		it("escape", function() {
			return testEscape("USER", "dae", "mon");
		});
	});

	describe("VOLUME", function() {
		it("simple", function() {
			testValidArgument("VOLUME", "/var/log");
		});

		it("escape", function() {
			let diagnostics = validate("FROM node\nVOLUME /var/log \\\n /tmp");
			assert.equal(diagnostics.length, 0);
		});
	});

	describe("WORKDIR", function() {
		it("ok", function() {
			testValidArgument("WORKDIR", "/orion");
		});

		it("escape", function() {
			testEscape("WORKDIR", "/or", "ion");
		});
	});
});
