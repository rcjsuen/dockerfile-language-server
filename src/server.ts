/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	createConnection, InitializeParams, InitializeResult, ClientCapabilities,
	TextDocumentPositionParams, TextDocumentSyncKind, TextDocument, TextEdit, Hover,
	CompletionItem, CodeActionParams, Command, ExecuteCommandParams, 
	DocumentSymbolParams, SymbolInformation, SignatureHelp,
	DocumentFormattingParams, DocumentRangeFormattingParams, DocumentOnTypeFormattingParams, DocumentHighlight,
	RenameParams, WorkspaceEdit, Location,
	DidChangeTextDocumentParams, DidOpenTextDocumentParams, DidCloseTextDocumentParams, TextDocumentContentChangeEvent,
	DidChangeConfigurationNotification, ProposedFeatures
} from 'vscode-languageserver';
import { ConfigurationItem } from 'vscode-languageserver-protocol/lib/protocol.configuration.proposed';
import { Validator, ValidationSeverity } from './dockerValidator';
import { ValidatorSettings } from './dockerValidatorSettings';
import { DockerAssist } from './dockerAssist';
import { CommandIds, DockerCommands } from './dockerCommands';
import { DockerHover } from './dockerHover';
import { MarkdownDocumentation } from './dockerMarkdown';
import { PlainTextDocumentation } from './dockerPlainText';
import { DockerSignatures } from './dockerSignatures';
import { DockerSymbols } from './dockerSymbols';
import { DockerFormatter } from './dockerFormatter';
import { DockerHighlight } from './dockerHighlight';
import { DockerRename } from './dockerRename';
import { DockerDefinition } from './dockerDefinition';
import { DockerRegistryClient } from './dockerRegistryClient';

let markdown = new MarkdownDocumentation();
let hoverProvider = new DockerHover(markdown);
let commandsProvider = new DockerCommands();
let symbolsProvider = new DockerSymbols();
let formatterProvider = new DockerFormatter();
let definitionProvider = new DockerDefinition();
let documentationResolver = new PlainTextDocumentation();
let signatureHelp = new DockerSignatures();

/**
 * The settings to use for the validator if the client doesn't support
 * workspace/configuration requests.
 */
let validatorSettings: ValidatorSettings | null = null;

/**
 * The validator settings that correspond to an individual file retrieved via
 * the workspace/configuration request.
 */
let validatorConfigurations: Map<string, Thenable<ValidatorConfiguration>> = new Map();

let connection = createConnection(ProposedFeatures.all);
let dockerRegistryClient = new DockerRegistryClient(connection);

let snippetSupport: boolean = false;

/**
 * Whether the client supports the workspace/applyEdit request.
 */
let applyEditSupport: boolean = false;

/**
 * Whether the client supports the workspace/configuration request.
 */
let configurationSupport: boolean = false;

let documents: { [ uri: string ]: TextDocument } = {};

function supportsSnippets(capabilities: ClientCapabilities): boolean {
	return capabilities.textDocument
		&& capabilities.textDocument.completion
		&& capabilities.textDocument.completion.completionItem
		&& capabilities.textDocument.completion.completionItem.snippetSupport;
}

connection.onInitialized(() => {
	if (configurationSupport) {
		// listen for notification changes if the client supports workspace/configuration
		connection.client.register(DidChangeConfigurationNotification.type);
	}
});

connection.onInitialize((params: InitializeParams): InitializeResult => {
	snippetSupport = supportsSnippets(params.capabilities);
	applyEditSupport = params.capabilities.workspace && params.capabilities.workspace.applyEdit === true;
	configurationSupport = params.capabilities.workspace && (params.capabilities.workspace as any).configuration === true;
	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			codeActionProvider: applyEditSupport,
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: [
					'=',
					' ',
					'$',
					'-',
				]
			},
			executeCommandProvider: applyEditSupport ? {
				commands: [
					CommandIds.LOWERCASE,
					CommandIds.UPPERCASE,
					CommandIds.EXTRA_ARGUMENT,
					CommandIds.DIRECTIVE_TO_BACKSLASH,
					CommandIds.DIRECTIVE_TO_BACKTICK,
					CommandIds.FLAG_TO_CHOWN,
					CommandIds.FLAG_TO_COPY_FROM,
					CommandIds.FLAG_TO_HEALTHCHECK_INTERVAL,
					CommandIds.FLAG_TO_HEALTHCHECK_RETRIES,
					CommandIds.FLAG_TO_HEALTHCHECK_START_PERIOD,
					CommandIds.FLAG_TO_HEALTHCHECK_TIMEOUT,
					CommandIds.CONVERT_TO_AS
				]
			} : undefined,
			documentFormattingProvider: true,
			documentRangeFormattingProvider: true,
			documentOnTypeFormattingProvider: {
				firstTriggerCharacter: '\\',
				moreTriggerCharacter: [ '`' ]
			},
			hoverProvider: true,
			documentSymbolProvider: true,
			documentHighlightProvider: true,
			renameProvider: true,
			definitionProvider: true,
			signatureHelpProvider: {
				triggerCharacters: [
					'-',
					'[',
					',',
					' ',
					'='
				]
			}
		}
	}
});

function validateTextDocument(textDocument: TextDocument): void {
	if (configurationSupport) {
		getConfiguration(textDocument.uri).then((config: ValidatorConfiguration) => {
			let maintainer = ValidationSeverity.WARNING;
			let directiveCasing = ValidationSeverity.WARNING;
			let emptyContinuationLine = ValidationSeverity.WARNING;
			let instructionCasing = ValidationSeverity.WARNING;
			let instructionCmdMultiple = ValidationSeverity.WARNING;
			let instructionEntrypointMultiple = ValidationSeverity.WARNING;
			let instructionHealthcheckMultiple = ValidationSeverity.WARNING;
			if (config) {
				maintainer = getSeverity(config.deprecatedMaintainer);
				directiveCasing = getSeverity(config.directiveCasing);
				emptyContinuationLine = getSeverity(config.emptyContinuationLine);
				instructionCasing = getSeverity(config.instructionCasing);
				instructionCmdMultiple = getSeverity(config.instructionCmdMultiple);
				instructionEntrypointMultiple = getSeverity(config.instructionEntrypointMultiple);
				instructionHealthcheckMultiple = getSeverity(config.instructionHealthcheckMultiple);
			}
			const fileSettings = {
				deprecatedMaintainer: maintainer,
				directiveCasing: directiveCasing,
				emptyContinuationLine: emptyContinuationLine,
				instructionCasing: instructionCasing,
				instructionCmdMultiple: instructionCmdMultiple,
				instructionEntrypointMultiple: instructionEntrypointMultiple,
				instructionHealthcheckMultiple: instructionHealthcheckMultiple
			};
			const validator = new Validator(fileSettings);
			const diagnostics = validator.validate(textDocument);
			connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
		});
	} else {
		const validator = new Validator(validatorSettings);
		const diagnostics = validator.validate(textDocument);
		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
	}
}

interface ValidatorConfiguration {
	deprecatedMaintainer?: string,
	directiveCasing?: string,
	emptyContinuationLine?: string,
	instructionCasing?: string,
	instructionCmdMultiple?: string,
	instructionEntrypointMultiple?: string,
	instructionHealthcheckMultiple?: string
}

interface Settings {
	docker: {
		languageserver: {
			diagnostics?: ValidatorConfiguration
		}
	}
}

function getSeverity(severity: string | undefined): ValidationSeverity | null {
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

/**
 * Gets the validation configuration that pertains to the specified resource.
 * 
 * @param resource the interested resource
 * @return the configuration to use to validate the interested resource
 */
function getConfiguration(resource: string): Thenable<ValidatorConfiguration> {
	let result = validatorConfigurations.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({ section: "docker.languageserver.diagnostics", scopeUri: resource });
		validatorConfigurations.set(resource, result);
	}
	return result;
}

// listen for notifications when the client's configuration has changed
connection.onNotification(DidChangeConfigurationNotification.type, () => {
	refreshConfigurations();
});

/**
 * Wipes and reloads the internal cache of validator configurations.
 */
function refreshConfigurations() {
	// store all the URIs that need to be refreshed
	const settingsRequest: ConfigurationItem[] = [];
	for (let uri in documents) {
		settingsRequest.push({ section: "docker.languageserver.diagnostics", scopeUri: uri });
	}
	// clear the cache
	validatorConfigurations.clear();

	// ask the workspace for the configurations
	connection.workspace.getConfiguration(settingsRequest).then((values: ValidatorConfiguration[]) => {
		const toRevalidate: string[] = [];
		for (let i = 0; i < values.length; i++) {
			const resource = settingsRequest[i].scopeUri;
			// a value might have been stored already, use it instead and ignore this one if so
			if (values[i] && !validatorConfigurations.has(resource)) {
				validatorConfigurations.set(resource, Promise.resolve(values[i]));
				toRevalidate.push(resource);
			}
		}

		for (const resource of toRevalidate) {
			validateTextDocument(documents[resource]);
		}
	});
}

connection.onDidChangeConfiguration((change) => {
	if (configurationSupport) {
		refreshConfigurations();
	} else {
		let settings = <Settings>change.settings;
		let maintainer = ValidationSeverity.WARNING;
		let directiveCasing = ValidationSeverity.WARNING;
		let emptyContinuationLine = ValidationSeverity.WARNING;
		let instructionCasing = ValidationSeverity.WARNING;
		let instructionCmdMultiple = ValidationSeverity.WARNING;
		let instructionEntrypointMultiple = ValidationSeverity.WARNING;
		let instructionHealthcheckMultiple = ValidationSeverity.WARNING;
		if (settings.docker && settings.docker.languageserver && settings.docker.languageserver.diagnostics) {
			maintainer = getSeverity(settings.docker.languageserver.diagnostics.deprecatedMaintainer);
			directiveCasing = getSeverity(settings.docker.languageserver.diagnostics.directiveCasing);
			emptyContinuationLine = getSeverity(settings.docker.languageserver.diagnostics.emptyContinuationLine);
			instructionCasing = getSeverity(settings.docker.languageserver.diagnostics.instructionCasing);
			instructionCmdMultiple = getSeverity(settings.docker.languageserver.diagnostics.instructionCmdMultiple);
			instructionEntrypointMultiple = getSeverity(settings.docker.languageserver.diagnostics.instructionEntrypointMultiple);
			instructionHealthcheckMultiple = getSeverity(settings.docker.languageserver.diagnostics.instructionHealthcheckMultiple);
		}
		validatorSettings = {
			deprecatedMaintainer: maintainer,
			directiveCasing: directiveCasing,
			emptyContinuationLine: emptyContinuationLine,
			instructionCasing: instructionCasing,
			instructionCmdMultiple: instructionCmdMultiple,
			instructionEntrypointMultiple: instructionEntrypointMultiple,
			instructionHealthcheckMultiple: instructionHealthcheckMultiple
		};
		// validate all the documents again
		Object.keys(documents).forEach((key) => {
			validateTextDocument(documents[key]);
		});
	}
});

connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] | PromiseLike<CompletionItem[]> => {
	let document = documents[textDocumentPosition.textDocument.uri];
	if (document) {
		let assist = new DockerAssist(document, snippetSupport, dockerRegistryClient);
		return assist.computeProposals(document, textDocumentPosition.position);
	}
	return null;
});

connection.onSignatureHelp((textDocumentPosition: TextDocumentPositionParams): SignatureHelp => {
	let document = documents[textDocumentPosition.textDocument.uri];
	if (document !== null) {
		return signatureHelp.computeSignatures(document, textDocumentPosition.position);
	}
	return {
		signatures: [],
		activeSignature: null,
		activeParameter: null,
	};
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
	if (applyEditSupport && codeActionParams.context.diagnostics.length > 0) {
		return commandsProvider.analyzeDiagnostics(
			codeActionParams.context.diagnostics, codeActionParams.textDocument.uri
		);
	}
	return [];
});

connection.onExecuteCommand((params: ExecuteCommandParams): void => {
	if (applyEditSupport) {
		let uri: string = params.arguments[0];
		let document = documents[uri];
		if (document) {
			let edit = commandsProvider.createWorkspaceEdit(document, params);
			if (edit) {
				connection.workspace.applyEdit(edit);
			}
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

connection.onDocumentOnTypeFormatting((onTypeFormattingParams: DocumentOnTypeFormattingParams): TextEdit[] => {
	const document = documents[onTypeFormattingParams.textDocument.uri];
	if (document) {
		return formatterProvider.formatOnType(document, onTypeFormattingParams.position, onTypeFormattingParams.ch, onTypeFormattingParams.options);
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
	let sorted: TextDocumentContentChangeEvent[] = [];
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
			let end: number = null;
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
	let document = documents[didChangeTextDocumentParams.textDocument.uri];
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
	validatorConfigurations.delete(didCloseTextDocumentParams.textDocument.uri);
	delete documents[didCloseTextDocumentParams.textDocument.uri];
});

// setup complete, start listening for a client connection
connection.listen();
