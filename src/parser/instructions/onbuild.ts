/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { Instruction } from '../instruction';

export class Onbuild extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getTriggerInstruction(): string | null {
		let trigger = this.getTrigger();
		return trigger === null ? null : trigger.toUpperCase();
	}

	private getTrigger(): string | null {
		return this.getRangeContent(this.getTriggerRange());
	}

	public getTriggerRange(): Range | null {
		let args = this.getArguments();
		return args.length > 0 ? args[0].getRange() : null;
	}
}