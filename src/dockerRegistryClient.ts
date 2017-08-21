/* --------------------------------------------------------------------------------------------
 * Copyright (c) Remy Suen. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import https = require('https');
import { IConnection } from 'vscode-languageserver';

/**
 * The DockerRegistryClient provides a way to communicate with the
 * official Docker registry hosted on Docker Hub.
 */
export class DockerRegistryClient {

	private readonly connection: IConnection;

	constructor(connection: IConnection) {
		this.connection = connection;
	}

	/**
	 * Gets the list of tags of the specified image from the Docker registry on Docker Hub.
	 * 
	 * @param image the name of the interested image
	 * @param prefix an optional prefix for filtering the list of tags
	 * @return a promise that resolves to the specified image's list
	 *         of tags, may be empty
	 */
	public getTags(image: string, prefix?: string): Promise<string[]> {
		if (image.indexOf('/') === -1) {
			image = "library/" + image;
		}

		return this.requestToken(image).then((data: any) => {
			if (data === null) {
				return [];
			}

			return this.listTags(data.token, image).then((data: any) => {
				if (!prefix) {
					return data.tags;
				}

				const tags = [];
				for (const tag of data.tags) {
					if (tag.indexOf(prefix) === 0) {
						tags.push(tag);
					}
				}
				return tags;
			});
		});
	}

	/**
	 * Requests for an authentication token from the Docker registry
	 * for accessing the given image.
	 * 
	 * @param image the name of the interested image
	 * @return a promise that resolves to the authentication token if
	 *         successful, or null if an error has occurred
	 */
	private requestToken(image: string): Promise<any> {
		return this.performHttpsGet({
			hostname: "auth.docker.io",
			port: 443,
			path: "/token?service=registry.docker.io&scope=repository:" + image + ":pull",
			headers: {
				Accept: "application/json"
			}
		}).catch((error) => {
			this.log(error);
			return null;
		});
	}

	/**
	 * Queries the registry for the given image's list of tags.
	 * 
	 * @param authToken the authentication token to use for the GET
	 * @param image the name of the interested image
	 * @return a promise that will resolve to the image's list of
	 *         tags, an empty array will be returned if an error
	 *         occurs during the GET request
	 */
	private listTags(authToken: string, image: string): Promise<string[]> {
		return this.performHttpsGet({
			hostname: "registry-1.docker.io",
			port: 443,
			path: "/v2/" + image + "/tags/list",
			headers: {
				Accept: "application/json",
				Authorization: "Bearer " + authToken
			}
		}).catch((error) => {
			this.log(error);
			return { tags: [] };
		});
	}

	private performHttpsGet(opts: https.RequestOptions): Promise<any> {
		return new Promise<any>((resolve, reject) => {
			const request = https.get(opts, (response) => {
				if (response.statusCode !== 200) {
					// not a 200 OK, reject the promise with the error
					const error: any = new Error(response.statusMessage);
					error.statusCode = response.statusCode;
					reject(error);
				} else {
					let buffer = '';
					response.on('data', (data: string) => {
						buffer += data;
					})
					response.on('end', () => {
						resolve(JSON.parse(buffer));
					});
				}
			});
			request.end();
			request.on('error', (error) => {
				reject(error);
			});
		});
	}

	private log(error: any) {
		if (this.connection) {
			this.connection.console.log(error.toString());
		}
	}
}
