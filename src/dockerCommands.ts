/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, Command, Diagnostic,
	Hover, TextDocumentPositionParams, Range,
	ExecuteCommandParams, WorkspaceEdit, TextEdit
} from 'vscode-languageserver';
import { ValidationCode } from './dockerValidator';

export class CommandIds {
	static readonly LOWERCASE = "docker.command.convertLowercase";
	static readonly EXTRA_ARGUMENT = "docker.command.removeExtraArgument";
	static readonly DIRECTIVE_TO_BACKTICK = "docker.command.directiveToBacktick";
	static readonly DIRECTIVE_TO_BACKSLASH = "docker.command.directiveToBackslash";
}

export class DockerCommands {

	public analyzeDiagnostics(diagnostics: Diagnostic[], textDocumentURI: string, range: Range): Command[] {
		for (let i = 0; i < diagnostics.length; i++) {
			switch (diagnostics[i].code) {
				case ValidationCode.LOWERCASE:
					return [
						{
							title: "Convert instruction to uppercase",
							command: CommandIds.LOWERCASE,
							arguments: [
								textDocumentURI,
								range
							]
						}
					];
				case ValidationCode.EXTRA_ARGUMENT:
					return [
						{
							title: "Remove extra argument",
							command: CommandIds.EXTRA_ARGUMENT,
							arguments: [
								textDocumentURI,
								range
							]
						}
					];
				case ValidationCode.INVALID_ESCAPE_DIRECTIVE:
					return [
						{
							title: "Convert to backslash",
							command: CommandIds.DIRECTIVE_TO_BACKSLASH,
							arguments: [
								textDocumentURI,
								range
							]
						},
						{
							title: "Convert to backtick",
							command: CommandIds.DIRECTIVE_TO_BACKTICK,
							arguments: [
								textDocumentURI,
								range
							]
						}
					];
			}
		}
		return [];
	}

	public createWorkspaceEdit(document: TextDocument, params: ExecuteCommandParams): WorkspaceEdit {
		let uri: string = params.arguments[0];
		let range: Range = params.arguments[1];
		switch (params.command) {
			case CommandIds.LOWERCASE:
				let instruction = document.getText().substring(document.offsetAt(range.start), document.offsetAt(range.end));
				return {
					changes: {
						[
							uri
						]:
						[
							TextEdit.replace(range, instruction.toUpperCase())
						]
					}
				};
			case CommandIds.EXTRA_ARGUMENT:
				return {
					changes: {
						[
							uri
						]:
						[
							TextEdit.del(range)
						]
					}
				};
			case CommandIds.DIRECTIVE_TO_BACKSLASH:
				return {
					changes: {
						[
							uri
						]:
						[
							TextEdit.replace(range, '\\')
						]
					}
				};
			case CommandIds.DIRECTIVE_TO_BACKTICK:
				return {
					changes: {
						[
							uri
						]:
						[
							TextEdit.replace(range, '`')
						]
					}
				};
		}
		return null;
	}
	
}
