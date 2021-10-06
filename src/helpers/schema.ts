/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

// eslint-disable-next-line import/no-extraneous-dependencies
import { JSONSchema4, JSONSchema7, JSONSchema7Definition } from 'json-schema';

export function createInitialActMessage(schema: JSONSchema4 | JSONSchema7) {
	const definitionsMap = new Map<string, JSONSchema4>();

	try {
		const extractSchema = (
			jsonSchema: JSONSchema4 | JSONSchema7Definition,
			title: string,
			isArray = false,
		): object => {
			if (typeof jsonSchema === 'boolean') return {};

			let currentSchema = jsonSchema;

			if (currentSchema.definitions) {
				Object.entries(currentSchema.definitions)
					.forEach(
						([key, schm]) => definitionsMap.set(schm.id || key, schm),
					);
			}

			if (currentSchema.$ref) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				currentSchema = definitionsMap.get(currentSchema.$ref.replace('#/definitions/', ''))!;
			}

			if (currentSchema.enum) {
				return {
					[title]: currentSchema.enum[0],
				};
			}

			switch (currentSchema.type) {
				case 'object': {
					if (!currentSchema.properties && typeof currentSchema.additionalProperties !== 'object') {
						throw new Error('Object schema doesn\'t contain properties');
					}

					if (currentSchema.properties) {
						const data = {
							...Object.keys(currentSchema.properties)
								.reduce((prev, curr) => {
									if (!currentSchema.properties) {
										throw new Error('Object schema doesn\'t contain properties');
									}
									return {
										...prev,
										...extractSchema(currentSchema.properties[curr], curr),
									};
								}, {}),
						};
						return isArray ? data : {
							[title]: data,
						};
					}
					return {
						[title]: {},
					};
				}
				case 'array': {
					if (Array.isArray(currentSchema.items)) {
						return {
							[title]: [
								...(currentSchema.items as Array<object>).map(
									(arrayField: JSONSchema4 | JSONSchema7Definition) =>
										extractSchema(arrayField, '', true),
								),
							],
						};
					}
					return {
						[title]: [],
					};
				}
				case 'string': {
					return {
						[title]: '',
					};
				}
				case 'integer': {
					return {
						[title]: 0,
					};
				}
				case 'number': {
					return {
						[title]: 0,
					};
				}
				case 'boolean': {
					return {
						[title]: false,
					};
				}
				case 'null': {
					return {
						[title]: null,
					};
				}
				default: return {};
			}
		};
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const content = schema.properties!;
		if (schema.definitions) {
			Object.entries(schema.definitions)
				.forEach(
					([key, schm]) => {
						definitionsMap.set(schm.id || key, schm);
					},
				);
		}
		const result = Object.keys(content)
			.reduce((prev, curr) => ({
				...prev,
				...extractSchema(content[curr], curr),
			}), {});
		return JSON.stringify(result, null, 4);
	} catch (error) {
		console.error('Error occurred while initiating message', error);
		return null;
	}
}
