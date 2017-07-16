/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { TextDocument, Position, Range, Location } from 'vscode-languageserver';
import { Util } from './docker';
import { Dockerfile } from './parser/dockerfile';
import { DockerfileParser } from './parser/dockerfileParser';
import { Property } from './parser/property';
import { Arg } from './parser/instructions/arg';

export class DockerDefinition {

	private computeBuildStageDefinition(uri: string, dockerfile: Dockerfile, position: Position): Location | null {
		let source = undefined;
		for (let instruction of dockerfile.getCOPYs()) {
			let range = instruction.getFromValueRange();
			if (range && range.start.line === position.line && range.start.character <= position.character && position.character <= range.end.character) {
				source = instruction.getFromValue();
				break;
			}
		}

		for (let instruction of dockerfile.getFROMs()) {
			let range = instruction.getBuildStageRange();
			if (range &&
					((range.start.line === position.line && range.start.character <= position.character && position.character <= range.end.character) || (instruction.getBuildStage() === source))) {
				return Location.create(uri, range);
			}
		}
		return null;
	}

	public static computeVariableDefinition(dockerfile: Dockerfile, position: Position): Property {
		let variable = null;
		let variables = {};
		for (let arg of dockerfile.getARGs()) {
			let property = arg.getProperty();
			// might be an ARG with no arguments
			if (property) {
				// is the caret inside the definition itself
				if (Util.isInsideRange(position, property.getNameRange())) {
					return property;
				}
				variables[property.getName()] = property;
			}
		}
		for (let env of dockerfile.getENVs()) {
			let properties = env.getProperties();
			for (let property of properties) {
				// is the caret inside the definition itself
				if (Util.isInsideRange(position, property.getNameRange())) {
					return variables[property.getName()] ? variables[property.getName()] : property;
				} else if (!variables[property.getName()]) {
					variables[property.getName()] = property;
				}
			}
		}
		for (let instruction of dockerfile.getInstructions()) {
			for (let variable of instruction.getVariables()) {
				if (Util.isInsideRange(position, variable.getNameRange())) {
					if (variables[variable.getName()]) {
						return variables[variable.getName()];
					}
					return null;
				}
			}
		}
		return null;
	}

	private computeVariableDefinition(uri: string, dockerfile: Dockerfile, position: Position): Location | null {
		let property = DockerDefinition.computeVariableDefinition(dockerfile, position);
		return property ? Location.create(uri, property.getNameRange()) : null;
	}

	public computeDefinition(document: TextDocument, position: Position): Location | null {
		let parser = new DockerfileParser();
		let dockerfile = parser.parse(document);
		let definition = this.computeBuildStageDefinition(document.uri, dockerfile, position);
		if (definition !== null) {
			return definition;
		}
		definition = this.computeVariableDefinition(document.uri, dockerfile, position);
		if (definition !== null) {
			return definition;
		}

		return null;
	}
}
