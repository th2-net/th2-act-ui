/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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
import { JSONSchema4 } from 'json-schema';
import {
	Field,
	isArrayField,
	isMapField,
	isSimpleField,
	ParsedMessage,
	SimpleField,
} from '../models/Message';

export const createParsedSchema = (message: ParsedMessage): JSONSchema4 => {
	const createField = (
		field: Field,
		title: string,
		isArray = false,
	): JSONSchema4 => {
		if (isSimpleField(field)) {
			const simpleField: { [key: string]: JSONSchema4 } = {
				[title]: {
					type: parseValueType(field),
					required: field.required ? [] as string[] : undefined,
				},
			};
			if (field.allowedValues && Object.keys(field.allowedValues).length) {
				simpleField[title].enum = Object.values(field.allowedValues);
			}
			return simpleField;
		}

		if (isMapField(field)) {
			const mapField: { [key: string]: JSONSchema4 } = {
				[title]: {
					type: 'object',
					properties: {
						...Object.keys(field.value).reduce(
							(prev, curr) => ({
								...prev,
								...createField(field.value[curr], curr),
							}),
							{},
						),
					},
				},
			};
			return isArray ? mapField[title] : mapField;
		}

		if (isArrayField(field)) {
			return {
				[title]: {
					type: 'array',
					items: {
						...createField(field.value[0], '', true),
					},
				},
			};
		}

		return {};
	};

	const messageContent = getMessageContent(message);

	return Object.keys(messageContent).reduce(
		(schema, schemaKey) => ({
			...schema,
			...createField(messageContent[schemaKey], schemaKey),
		}),
		{},
	);
};

function getMessageContent(message: ParsedMessage) {
	return message[Object.keys(message)[0]].content;
}

function parseValueType(field: SimpleField) {
	return field.valueType.toLowerCase() as 'string' | 'number' | 'boolean';
}

export function createInitialParsedMessage(schema: ParsedMessage) {
	try {
		const extractField = (field: Field, title: string, isArray = false): object => {
		    if (!field.required) return {};
			if (isSimpleField(field)) {
				const allowedValues = Object.values(field.allowedValues);
				const value = field.defaultValue
					? field.defaultValue
					: allowedValues.length
						? allowedValues[0]
						: getDefaultParsedValue(field.valueType);
				return {
					[title]: value,
				};
			}
			if (isMapField(field)) {
				const data = {
					...Object.keys(field.value)
						.reduce((prev, curr) => ({
							...prev,
							...extractField(field.value[curr], curr),
						}), {}),
				};
				return isArray ? data : {
					[title]: data,
				};
			}
			if (isArrayField(field)) {
				return {
					[title]: [
						...field.value
							.map(arrayField => extractField(arrayField, '', true)),
					],
				};
			}
			return {};
		};
		const content = schema[Object.keys(schema)[0]].content;
		const result = Object.keys(content)
			.reduce((prev, curr) => ({
				...prev,
				...extractField(content[curr], curr),
			}), {});
		return JSON.stringify(result, null, 4);
	} catch (error) {
		console.error('Error occurred while initiating message');
		return null;
	}
}

function getDefaultParsedValue(type: 'STRING' | 'NUMBER' | 'BOOLEAN') {
	switch (type) {
		case 'STRING': {
			return '';
		}
		case 'NUMBER': {
			return 0;
		}
		case 'BOOLEAN': {
			return false;
		}
		default: return '';
	}
}

export function createInitialActMessage(schema: JSONSchema4) {
	const definitionsMap = new Map<string, JSONSchema4>();

	try {
		const extractSchema = (jsonSchema: JSONSchema4, title: string, isArray = false): object => {
			let currentSchema = jsonSchema;

			if (currentSchema.definitions) {
				Object.entries(currentSchema.definitions)
					.forEach(
						([key, schm]) => definitionsMap.set(schm.id || key, schm),
					);
			}
			if (currentSchema.$ref) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				currentSchema = definitionsMap.get(currentSchema.$ref)!;
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
								...currentSchema.items
									.map((arrayField: JSONSchema4) => extractSchema(arrayField, '', true)),
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
