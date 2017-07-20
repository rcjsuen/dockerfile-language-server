/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range, Position } from 'vscode-languageserver';
import { ModifiableInstruction } from './modifiableInstruction';

export class Copy extends ModifiableInstruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public stopSearchingForFlags(argument: string): boolean {
		return argument.indexOf("--") === -1;
	}

	public getFromValue(): string | null {
		return this.getRangeContent(this.getFromValueRange());
	}

	public getFromValueRange(): Range | null {
		let range = this.getFromRange();
		if (range === null) {
			return null;
		}
		return Range.create(Position.create(range.start.line, range.start.character + 7), range.end);
	}

	private getFromRange(): Range | null {
		let args = this.getArguments();
		if (args.length >= 1 && args[0].getValue().toLowerCase().indexOf("--from=") === 0) {
			return args[0].getRange();
		}
		return null;
	}
}
