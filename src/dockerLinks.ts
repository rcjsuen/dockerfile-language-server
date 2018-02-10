/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { TextDocument, DocumentLink } from 'vscode-languageserver';
import { DockerfileParser } from 'dockerfile-ast';

export class DockerLinks {

	public getLinks(document: TextDocument): DocumentLink[] {
		let dockerfile = DockerfileParser.parse(document.getText());
		let links = [];
		for (let from of dockerfile.getFROMs()) {
			let name = from.getImageName();
			if (name) {
				if (name.indexOf('/') === -1) {
					links.push({
						range: from.getImageNameRange(),
						target: "https://hub.docker.com/_/" + name + "/"
					});
				} else {
					links.push({
						range: from.getImageNameRange(),
						target: "https://hub.docker.com/r/" + name + "/"
					});
				}
			}
		}
		return links;
	}
}
