/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	TextDocument, TextDocumentPositionParams, SymbolInformation, SymbolKind
} from 'vscode-languageserver';
import { Util, DIRECTIVE_ESCAPE } from './docker';

export class DockerSymbols {

	private escapeChar: string;

	private createSymbolInformation(document: TextDocument, name: string, textDocumentURI: string, startOffset: number, endOffset: number, kind: SymbolKind) {
		return {
			name: name,
			location: {
				uri: textDocumentURI,
				range: {
					start: document.positionAt(startOffset),
					end: document.positionAt(endOffset)
				}
			},
			kind: kind
		};
	}

	private getDirectiveSymbol(document: TextDocument, buffer: string, textDocumentURI: string): SymbolInformation {
		// reset the escape directive in between runs
		this.escapeChar = '';
		directiveCheck: for (let i = 0; i < buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case ' ':
				case '\t':
				case '\r':
				case '\n':
					break;
				case '#':
					let directiveStart = -1;
					let directive = "";
					for (let j = i + 1; j < buffer.length; j++) {
						let char = buffer.charAt(j);
						switch (char) {
							case ' ':
							case '\t':
								break;
							case '\r':
							case '\n':
								break directiveCheck;
							case '=':
								if (directive.toLowerCase() === DIRECTIVE_ESCAPE) {
									directiveValue: for (let k = j + 1; k < buffer.length; k++) {
										char = buffer.charAt(k);
										switch (char) {
											case '\r':
											case '\n':
												break directiveValue;
											case '\t':
											case ' ':
												continue;
											default:
												if (k + 1 !== buffer.length && Util.isWhitespace(buffer.charAt(k + 1))) {
													this.escapeChar = char;
												}
												break;
										}
									}
									return this.createSymbolInformation(document, DIRECTIVE_ESCAPE, textDocumentURI, directiveStart, j - 1, SymbolKind.Property);
								}
								break directiveCheck;
							default:
								if (directiveStart === -1) {
									directiveStart = j;
								}
								directive = directive + char;
								break;
						}
					}
					break;
				default:
					break directiveCheck;
			}
		}
		return null;	
	}

	public parseSymbolInformation(document: TextDocument, textDocumentURI: string): SymbolInformation[] {
		let buffer = document.getText();
		let symbols: SymbolInformation[] = [];
		let directiveSymbol = this.getDirectiveSymbol(document, buffer, textDocumentURI);
		if (directiveSymbol) {
			symbols.push(directiveSymbol);
		}

		if (this.escapeChar !== '`' && this.escapeChar !== '\\') {
			this.escapeChar = '\\';
		}

		keywordCheck: for (let i = 0; i < buffer.length; i++) {
			switch (buffer.charAt(i)) {
				case ' ':
				case '\t':
				case '\r':
				case '\n':
					break;
				case '#':
					for (let j = i + 1; j < buffer.length; j++) {
						let char = buffer.charAt(j);
						switch (char) {
							case '\r':
							case '\n':
								i = j;
								continue keywordCheck;
						}
					}
					// reached EOF
					return symbols;
				default:
					let keywordStart = i;
					for (let j = i + 1; j < buffer.length; j++) {
						let char = buffer.charAt(j);
						switch (char) {
							case ' ':
							case '\t':
								let keyword = buffer.substring(keywordStart, j);
								symbols.push(this.createSymbolInformation(document, keyword, textDocumentURI, keywordStart, j, SymbolKind.Function));
								
								for (let k = j + 1; k < buffer.length; k++) {
									switch (buffer.charAt(k)) {
										case '\r':
										case '\n':
											i = k;
											continue keywordCheck;		
										case this.escapeChar:
											if (buffer.charAt(k + 1) === '\n') {
												k++;
											} else if (buffer.charAt(k + 1) === '\r') {
												if (buffer.charAt(k + 2) === '\n') {
													k = k + 2;
												} else {
													k++;
												}
											}
											continue;
									}
								}
								// reached EOF
								return symbols;
							case '\r':
							case '\n':
								let noArgsKeyword = buffer.substring(keywordStart, j);
								symbols.push(this.createSymbolInformation(document, noArgsKeyword, textDocumentURI, keywordStart, j, SymbolKind.Function));
								i = j;
								continue keywordCheck;
						}
					}
					// reached EOF
					let noArgsKeyword = buffer.substring(keywordStart, buffer.length);
					symbols.push(this.createSymbolInformation(document, noArgsKeyword, textDocumentURI, keywordStart, buffer.length, SymbolKind.Function));
					return symbols;
			}
		}
		return symbols;
	}

}
