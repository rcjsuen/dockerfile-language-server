/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument, Range } from 'vscode-languageserver';
import { DockerfileParser } from '../dockerfileParser';
import { Instruction } from '../instruction';

export class Onbuild extends Instruction {

	constructor(document: TextDocument, range: Range, escapeChar: string, instruction: string, instructionRange: Range) {
		super(document, range, escapeChar, instruction, instructionRange);
	}

	public getTrigger(): string | null {
		let trigger = this.getTriggerWord();
		return trigger === null ? null : trigger.toUpperCase();
	}

	public getTriggerWord(): string | null {
		return this.getRangeContent(this.getTriggerRange());
	}

	public getTriggerRange(): Range | null {
		let args = this.getArguments();
		return args.length > 0 ? args[0].getRange() : null;
	}

	public getTriggerInstruction(): Instruction | null {
		let triggerRange = this.getTriggerRange();
		if (triggerRange === null) {
			return null;
		}
		let args = this.getArguments();
		return DockerfileParser.createInstruction(
			this.document,
			this.escapeChar,
			Range.create(args[0].getRange().start, args[args.length - 1].getRange().end),
			this.getTriggerWord(),
			triggerRange);
	}
}