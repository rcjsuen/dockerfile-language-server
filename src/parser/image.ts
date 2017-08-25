/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { Range, Position } from 'vscode-languageserver';
import { Comment } from './comment';
import { Instruction } from './instruction';
import { Arg } from './instructions/arg';
import { Cmd } from './instructions/cmd';
import { Copy } from './instructions/copy';
import { Env } from './instructions/env';
import { Entrypoint } from './instructions/entrypoint';
import { From } from './instructions/from';
import { Healthcheck } from './instructions/healthcheck';
import { Onbuild } from './instructions/onbuild';
import { Util } from '../docker';

export class Image {

	private readonly comments: Comment[] = [];
	private readonly instructions: Instruction[] = [];

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

	/**
	 * Gets all the ARG instructions that are defined in this image.
	 */
	public getARGs(): Arg[] {
		let args = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Arg) {
				args.push(instruction);
			}
		}
		return args;
	}

	/**
	 * Gets all the CMD instructions that are defined in this image.
	 */
	public getCMDs(): Cmd[] {
		let cmds = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Cmd) {
				cmds.push(instruction);
			}
		}
		return cmds;
	}

	/**
	 * Gets all the COPY instructions that are defined in this image.
	 */
	public getCOPYs(): Copy[] {
		let copies = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Copy) {
				copies.push(instruction);
			}
		}
		return copies;
	}

	/**
	 * Gets all the ENTRYPOINT instructions that are defined in this image.
	 */
	public getENTRYPOINTs(): Entrypoint[] {
		let froms = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Entrypoint) {
				froms.push(instruction);
			}
		}
		return froms;
	}

	/**
	 * Gets all the ENV instructions that are defined in this image.
	 */
	public getENVs(): Env[] {
		let args = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Env) {
				args.push(instruction);
			}
		}
		return args;
	}

	/**
	 * Gets all the FROM instructions that are defined in this image.
	 */
	public getFROMs(): From[] {
		let froms = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof From) {
				froms.push(instruction);
			}
		}
		return froms;
	}

	/**
	 * Gets all the HEALTHCHECK instructions that are defined in this image.
	 */
	public getHEALTHCHECKs(): Healthcheck[] {
		let froms = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Healthcheck) {
				froms.push(instruction);
			}
		}
		return froms;
	}

	public getOnbuildTriggers(): Instruction[] {
		let triggers = [];
		for (let instruction of this.instructions) {
			if (instruction instanceof Onbuild) {
				let trigger = instruction.getTriggerInstruction();
				if (trigger) {
					triggers.push(trigger);
				}
			}
		}
		return triggers;
	}

	public contains(position: Position): boolean {
		const first = this.instructions[0].getRange();
		const last = this.instructions[this.instructions.length - 1].getRange();
		return Util.isInsideRange(position, Range.create(first.start, last.end));
	}

}
