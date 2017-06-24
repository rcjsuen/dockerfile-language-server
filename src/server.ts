/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	createConnection, IConnection, InitializeResult, ClientCapabilities,
	TextDocumentPositionParams, TextDocumentSyncKind, TextDocument, TextEdit, Range, Hover,
	CompletionItem, CompletionItemKind, InsertTextFormat,
	CodeActionParams, Command, ExecuteCommandParams, 
	DocumentSymbolParams, SymbolInformation, Diagnostic,
	DocumentFormattingParams,
	DidChangeTextDocumentParams, DidOpenTextDocumentParams, DidCloseTextDocumentParams
} from 'vscode-languageserver';
import { Validator, ValidationCode } from './dockerValidator';
import { DockerAssist } from './dockerAssist';
import { CommandIds, DockerCommands } from './dockerCommands';
import { DockerHover } from './dockerHover';
import { MarkdownDocumentation } from './dockerMarkdown';
import { PlainTextDocumentation } from './dockerPlainText';
import { DockerSymbols } from './dockerSymbols';
import { DockerFormatter } from './dockerFormatter';
import { KEYWORDS } from './docker';

let markdown = new MarkdownDocumentation();
let hoverProvider = new DockerHover(markdown);
let commandsProvider = new DockerCommands();
let symbolsProvider = new DockerSymbols();
let formatterProvider = new DockerFormatter();
let documentationResolver = new PlainTextDocumentation();

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
				resolveProvider: true
			},
			executeCommandProvider: {
				commands: [
					CommandIds.LOWERCASE,
					CommandIds.EXTRA_ARGUMENT,
					CommandIds.DIRECTIVE_TO_BACKSLASH,
					CommandIds.DIRECTIVE_TO_BACKTICK
				]
			},
			documentFormattingProvider: true,
			hoverProvider: true,
			documentSymbolProvider: true
		}
	}
});

function validateTextDocument(textDocument: TextDocument): void {
	var validator = new Validator();
	let diagnostics = validator.validate(KEYWORDS, textDocument);
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	let document = documents[textDocumentPosition.textDocument.uri];
	if (document) {
		let assist = new DockerAssist(document, snippetSupport);
		return assist.computeProposals(document.getText(), document.offsetAt(textDocumentPosition.position));
	}
	return null;
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	item.documentation = documentationResolver.getDocumentation(item.data);
	return item;
});

connection.onHover((textDocumentPosition: TextDocumentPositionParams): Hover => {
	let document = documents[textDocumentPosition.textDocument.uri];
	if (document !== null) {
		return hoverProvider.onHover(document, textDocumentPosition);
	}
	return null;
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

connection.onDidOpenTextDocument((didOpenTextDocumentParams: DidOpenTextDocumentParams): void => {
	let document = TextDocument.create(didOpenTextDocumentParams.textDocument.languageId, didOpenTextDocumentParams.textDocument.languageId, didOpenTextDocumentParams.textDocument.version, didOpenTextDocumentParams.textDocument.text);
	documents[didOpenTextDocumentParams.textDocument.uri] = document;
});

connection.onDidChangeTextDocument((didChangeTextDocumentParams: DidChangeTextDocumentParams): void => {
	let document: TextDocument = documents[didChangeTextDocumentParams.textDocument.uri];
	let buffer = document.getText();
	let changes = didChangeTextDocumentParams.contentChanges;
	for (let i = changes.length - 1; i >= 0; i--) {
		let offset = document.offsetAt(changes[i].range.start);
		let end = null;
		if (changes[i].range.end) {
			end = document.offsetAt(changes[i].range.end);
		} else {
			end = offset + changes[i].rangeLength;
		}
		buffer = buffer.substring(0, offset) + changes[i].text + buffer.substring(offset + end);
	}
	documents[didChangeTextDocumentParams.textDocument.uri] = TextDocument.create(didChangeTextDocumentParams.textDocument.uri, document.languageId, didChangeTextDocumentParams.textDocument.version, buffer);
});

connection.onDidCloseTextDocument((didCloseTextDocumentParams: DidCloseTextDocumentParams): void => {
	delete documents[didCloseTextDocumentParams.textDocument.uri];
});

// setup complete, start listening for a client connection
connection.listen();
