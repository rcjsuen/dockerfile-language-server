/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Flag } from '../flag';
import { JSONInstruction } from './jsonInstruction';

export class Copy extends JSONInstruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getArgumentsContent(): string | null {
		const args = this.getArguments();
		const flags = this.getFlags();
		if (args.length === 0 || flags.length === 0) {
			return super.getArgumentsContent();
		}
		return this.getRangeContent(Range.create(args[0].getRange().start, args[args.length - 1].getRange().end));
	}

	public stopSearchingForFlags(argument: string): boolean {
		return argument.indexOf("--") === -1;
	}

	public getFromFlag(): Flag | null {
		let flags = super.getFlags();
		return flags.length === 1 && flags[0].getName() === "from" ? flags[0] : null;
	}

	public getFromValue(): string | null {
		return this.getRangeContent(this.getFromValueRange());
	}

	public getFromValueRange(): Range | null {
		const flag = this.getFromFlag();
		return flag ? flag.getValueRange() : null;
	}
}
