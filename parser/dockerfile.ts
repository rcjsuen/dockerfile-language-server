/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Comment } from './comment';
import { Directive } from './directive';
import { Instruction } from './instruction';
import { Util, DIRECTIVE_ESCAPE } from '../src/docker';

export class Dockerfile {

	private readonly comments: Comment[] = [];
	private directive: Directive = null;
	private readonly instructions: Instruction[] = [];

	public getEscapeCharacter(): string {
		if (this.directive !== null && this.directive.getDirective() === DIRECTIVE_ESCAPE) {
			let value = this.directive.getValue();
			if (value === '\\' || value === '`') {
				return value;
			}
		}
		return '\\';
	}

	public addComment(comment: Comment): void {
		this.comments.push(comment);
	}

	public getComments(): Comment[] {
		return this.comments;
	}

	public addInstruction(instruction: Instruction): void {
		this.instructions.push(instruction);
	}

	public getInstructions(): Instruction[] {
		return this.instructions;
	}

	public setDirective(directive: Directive): void {
		this.directive = directive;
	}

	public getDirective(): Directive {
		return this.directive;
	}

}
