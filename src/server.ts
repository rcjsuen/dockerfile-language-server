/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	createConnection, IConnection, InitializeResult, ClientCapabilities,
	TextDocumentPositionParams, TextDocumentSyncKind, TextDocument, TextEdit, Hover,
	CompletionItem, CodeActionParams, Command, ExecuteCommandParams, 
	DocumentSymbolParams, SymbolInformation,
	DocumentFormattingParams, DocumentRangeFormattingParams, DocumentHighlight,
	RenameParams, WorkspaceEdit, Location,
	DidChangeTextDocumentParams, DidOpenTextDocumentParams, DidCloseTextDocumentParams, TextDocumentContentChangeEvent
} from 'vscode-languageserver';
import { Validator, ValidationSeverity } from './dockerValidator';
import { ValidatorSettings } from './dockerValidatorSettings';
import { DockerAssist } from './dockerAssist';
import { CommandIds, DockerCommands } from './dockerCommands';
import { DockerHover } from './dockerHover';
import { MarkdownDocumentation } from './dockerMarkdown';
import { PlainTextDocumentation } from './dockerPlainText';
import { DockerSymbols } from './dockerSymbols';
import { DockerFormatter } from './dockerFormatter';
import { DockerHighlight } from './dockerHighlight';
import { DockerRename } from './dockerRename';
import { DockerDefinition } from './dockerDefinition';
import { KEYWORDS } from './docker';

let markdown = new MarkdownDocumentation();
let hoverProvider = new DockerHover(markdown);
let commandsProvider = new DockerCommands();
let symbolsProvider = new DockerSymbols();
let formatterProvider = new DockerFormatter();
let definitionProvider = new DockerDefinition();
let documentationResolver = new PlainTextDocumentation();

let validatorSettings = null;

let connection: IConnection = createConnection();

let snippetSupport: boolean = false;

let documents: any = {};

function supportsSnippets(capabilities: ClientCapabilities): boolean {
	return capabilities.textDocument
		&& capabilities.textDocument.completion
		&& capabilities.textDocument.completion.completionItem
		&& capabilities.textDocument.completion.completionItem.snippetSupport;
}

connection.onInitialize((params): InitializeResult => {
	snippetSupport = supportsSnippets(params.capabilities);
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			codeActionProvider: true,
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: [
					'=',
					' ',
					'$'
				]
			},
			executeCommandProvider: {
				commands: [
					CommandIds.UPPERCASE,
					CommandIds.EXTRA_ARGUMENT,
					CommandIds.DIRECTIVE_TO_BACKSLASH,
					CommandIds.DIRECTIVE_TO_BACKTICK,
					CommandIds.CONVERT_TO_AS
				]
			},
			documentFormattingProvider: true,
			documentRangeFormattingProvider: true,
			hoverProvider: true,
			documentSymbolProvider: true,
			documentHighlightProvider: true,
			renameProvider: true,
			definitionProvider: true
		}
	}
});

function validateTextDocument(textDocument: TextDocument): void {
	var validator = new Validator(validatorSettings);
	let diagnostics = validator.validate(KEYWORDS, textDocument);
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

interface Settings {
	docker: {
		languageserver: {
			diagnostics?: {
				deprecatedMaintainer?: string,
				directiveCasing?: string,
				instructionCasing?: string,
				instructionCmdMultiple?: string,
				instructionEntrypointMultiple?: string,
				instructionHealthcheckMultiple?: string
			}
		}
	}
}

function getSeverity(severity: string): ValidationSeverity {
	switch (severity) {
		case "ignore":
			return ValidationSeverity.IGNORE;
		case "warning":
			return ValidationSeverity.WARNING;
		case "error":
			return ValidationSeverity.ERROR;
	}
	return null;
}

connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	let maintainer = ValidationSeverity.WARNING;
	let directiveCasing = ValidationSeverity.WARNING;
	let instructionCasing = ValidationSeverity.WARNING;
	let instructionCmdMultiple = ValidationSeverity.WARNING;
	let instructionEntrypointMultiple = ValidationSeverity.WARNING;
	let instructionHealthcheckMultiple = ValidationSeverity.WARNING;
	if (settings.docker && settings.docker.languageserver && settings.docker.languageserver.diagnostics) {
		maintainer = getSeverity(settings.docker.languageserver.diagnostics.deprecatedMaintainer);
		directiveCasing = getSeverity(settings.docker.languageserver.diagnostics.directiveCasing);
		instructionCasing = getSeverity(settings.docker.languageserver.diagnostics.instructionCasing);
		instructionCmdMultiple = getSeverity(settings.docker.languageserver.diagnostics.instructionCmdMultiple);
		instructionEntrypointMultiple = getSeverity(settings.docker.languageserver.diagnostics.instructionEntrypointMultiple);
		instructionHealthcheckMultiple = getSeverity(settings.docker.languageserver.diagnostics.instructionHealthcheckMultiple);
	}
	validatorSettings = {
		deprecatedMaintainer: maintainer,
		directiveCasing: directiveCasing,
		instructionCasing: instructionCasing,
		instructionCmdMultiple: instructionCmdMultiple,
		instructionEntrypointMultiple: instructionEntrypointMultiple,
		instructionHealthcheckMultiple: instructionHealthcheckMultiple
	};
	// validate all the documents again
	Object.keys(documents).forEach((key) => {
		validateTextDocument(documents[key]);
	});
});

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	let document = documents[textDocumentPosition.textDocument.uri];
	if (document) {
		let assist = new DockerAssist(document, snippetSupport);
		return assist.computeProposals(document, textDocumentPosition.position);
	}
	return null;
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (!item.documentation) {
		item.documentation = documentationResolver.getDocumentation(item.data);
	}
	return item;
});

connection.onHover((textDocumentPosition: TextDocumentPositionParams): Hover => {
	let document = documents[textDocumentPosition.textDocument.uri];
	if (document !== null) {
		return hoverProvider.onHover(document, textDocumentPosition);
	}
	return null;
});

connection.onDocumentHighlight((textDocumentPosition: TextDocumentPositionParams): DocumentHighlight[] => {
	let document = documents[textDocumentPosition.textDocument.uri];
	if (document) {
		let highlightProvider = new DockerHighlight();
		return highlightProvider.computeHighlightRanges(document, textDocumentPosition.position);
	}
	return [];
});

connection.onCodeAction((codeActionParams: CodeActionParams): Command[] => {
	if (codeActionParams.context.diagnostics.length > 0) {
		return commandsProvider.analyzeDiagnostics(
			codeActionParams.context.diagnostics, codeActionParams.textDocument.uri, codeActionParams.range
		);
	}
	return [];
});

connection.onExecuteCommand((params: ExecuteCommandParams): void => {
	let uri: string = params.arguments[0];
	let document = documents[uri];
	if (document) {
		let edit = commandsProvider.createWorkspaceEdit(document, params);
		if (edit) {
			connection.workspace.applyEdit(edit);
		}
	}
});

connection.onDefinition((textDocumentPosition: TextDocumentPositionParams): Location => {
	let uri = textDocumentPosition.textDocument.uri;
	let document = documents[uri];
	if (document) {
		return definitionProvider.computeDefinition(document, textDocumentPosition.position);
	}
	return null;
});

connection.onRenameRequest((params: RenameParams): WorkspaceEdit => {
	let document = documents[params.textDocument.uri];
	if (document) {
		let rename = new DockerRename();
		let edits = rename.rename(document, params.position, params.newName);
		return {
			changes: {
				[ params.textDocument.uri ]: edits
			}
		};
	}
	return null;
});

connection.onDocumentSymbol((documentSymbolParams: DocumentSymbolParams): SymbolInformation[] => {
	let uri = documentSymbolParams.textDocument.uri;
	let document = documents[uri];
	if (document) {
		return symbolsProvider.parseSymbolInformation(document, uri);
	}
	return [];
});

connection.onDocumentFormatting((documentFormattingParams: DocumentFormattingParams): TextEdit[] => {
	let document = documents[documentFormattingParams.textDocument.uri];
	if (document) {
		return formatterProvider.formatDocument(document, documentFormattingParams.options);
	}
	return [];
});

connection.onDocumentRangeFormatting((rangeFormattingParams: DocumentRangeFormattingParams): TextEdit[] => {
	let document = documents[rangeFormattingParams.textDocument.uri];
	if (document) {
		return formatterProvider.formatRange(document, rangeFormattingParams.range, rangeFormattingParams.options);
	}
	return [];
});

connection.onDidOpenTextDocument((didOpenTextDocumentParams: DidOpenTextDocumentParams): void => {
	let document = TextDocument.create(didOpenTextDocumentParams.textDocument.uri, didOpenTextDocumentParams.textDocument.languageId, didOpenTextDocumentParams.textDocument.version, didOpenTextDocumentParams.textDocument.text);
	documents[didOpenTextDocumentParams.textDocument.uri] = document;
	validateTextDocument(document);
});

function getLaterChange(changes: TextDocumentContentChangeEvent[], i: number, j: number): number {
	if (changes[i].range.start.line === changes[j].range.start.line) {
		return changes[i].range.start.character < changes[j].range.start.character ? j : i;
	} else if (changes[i].range.start.line < changes[j].range.start.line) {
		return j;
	}
	return i;
}

function sortChanges(changes: TextDocumentContentChangeEvent[]): TextDocumentContentChangeEvent[] {
	let sorted = [];
	let length = changes.length;
	for (let i = 0; i < length; i++) {
		let candidate = 0;
		for (let j = 1; j < changes.length; j++) {
			candidate = getLaterChange(changes, candidate, j);
		}
		sorted.push(changes[candidate]);
		changes.splice(candidate, 1);
	}
	return sorted;
}

function handleChanges(document: TextDocument, content: string, changes: TextDocumentContentChangeEvent[]) {
	if (changes.length === 1 && !changes[0].range) {
		// not an incremental change
		return changes[0].text;
	} else if (changes.length !== 0) {
		changes = sortChanges(changes);
		for (let i = 0; i < changes.length; i++) {
			let offset = document.offsetAt(changes[i].range.start);
			let end = null;
			if (changes[i].range.end) {
				end = document.offsetAt(changes[i].range.end);
			} else {
				end = offset + changes[i].rangeLength;
			}
			content = content.substring(0, offset) + changes[i].text + content.substring(end);
		}
	}
	return content;
}

connection.onDidChangeTextDocument((didChangeTextDocumentParams: DidChangeTextDocumentParams): void => {
	let document: TextDocument = documents[didChangeTextDocumentParams.textDocument.uri];
	let buffer = document.getText();
	let changes = didChangeTextDocumentParams.contentChanges;
	let changed = handleChanges(document, buffer, changes)
	if (changed !== buffer) {
		document = TextDocument.create(didChangeTextDocumentParams.textDocument.uri, document.languageId, didChangeTextDocumentParams.textDocument.version, changed);
		documents[didChangeTextDocumentParams.textDocument.uri] = document;
		validateTextDocument(document);
	}
});

connection.onDidCloseTextDocument((didCloseTextDocumentParams: DidCloseTextDocumentParams): void => {
	delete documents[didCloseTextDocumentParams.textDocument.uri];
});

// setup complete, start listening for a client connection
connection.listen();
