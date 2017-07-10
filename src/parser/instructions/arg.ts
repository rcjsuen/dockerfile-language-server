/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Instruction } from '../instruction';
import { Argument } from '../argument';

export class Arg extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getNameRange(): Range | null{
		let args = this.getArguments();
		if (args.length != 1) {
			return null;
		}
		let arg = args[0].getValue();
		let index = arg.indexOf('=');
		if (index !== -1) {
			return Range.create(args[0].getRange().start, this.document.positionAt(this.document.offsetAt(args[0].getRange().start) + index));
		}
		return null;
	}

	public getValue(): string | null {
		let value = this.getRangeContent(this.getValueRange());
		if (value === null) {
			return null;
		}

		let first = value.charAt(0);
		let last = value.charAt(value.length - 1);
		if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
			return value.substring(1, value.length - 1);
		}
		return value;
	}

	private getValueRange(): Range | null {
		let args = this.getArguments();
		if (args.length != 1) {
			return null;
		}
		let arg = args[0].getValue();
		let index = arg.indexOf('=');
		if (index !== -1) {
			let startIndex = this.findLeadingNonWhitespace(arg.substring(index + 1));
			let endIndex = this.findTrailingNonWhitespace(arg);
			return Range.create(
				this.document.positionAt(this.document.offsetAt(args[0].getRange().start) + index + startIndex + 1),
				this.document.positionAt(this.document.offsetAt(args[0].getRange().start) + endIndex + 1)
			);
		}
		return null;
	}

	private findLeadingNonWhitespace(content: string): number {
		for (let i = 0; i < content.length; i++) {
			switch (content.charAt(i)) {
				case ' ':
				case '\t':
					continue;
				case this.escapeChar:
					escapeCheck: for (let j = i + 1; j < content.length; j++) {
						switch (content.charAt(j)) {
							case ' ':
							case '\t':
								continue;
							case '\r':
								if (content.charAt(j + 1) === '\n') {
									i = j + 1;
									break escapeCheck;
								}
							case '\n':
								i = j;
								break escapeCheck;
							default:
								return i;
						}
					}
					break;
				default:
					return i;
			}
		}
		return -1;
	}

	private findTrailingNonWhitespace(content: string): number {
		for (let i = content.length - 1; i >= 0; i--) {
			switch (content.charAt(i)) {
				case ' ':
				case '\t':
					continue;
				case '\n':
					if (content.charAt(i - 1) === '\r') {
						i = i - 1;
					}
				case '\r':
					for (let j = i - 1; j >= 0; j--) {
						switch (content.charAt(j)) {
							case ' ':
							case '\t':
							case this.escapeChar:
								continue;
							default:
								return j;
						}
					}
					break;
				default:
					return i;
			}
		}
		return content.length;
	}

	public getArguments(): Argument[] {
		let args = [];
		let range = this.getInstructionRange();
		let endOffset = this.document.offsetAt(range.end);
		let extra = endOffset - this.document.offsetAt(range.start);
		let content = this.getTextContent();
		let fullArgs = content.substring(extra);
		let start = this.findLeadingNonWhitespace(fullArgs);

		if (start === -1) {
			// only whitespace found, no arguments
			return [];
		}

		let end = this.findTrailingNonWhitespace(fullArgs);

		return [
			new Argument(fullArgs.substring(start, end + 1), Range.create(this.document.positionAt(endOffset + start), this.document.positionAt(endOffset + end + 1)))
		];
	}
}
