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
import { JSONSchema7 } from 'json-schema';
import {
	Field, isMapField, isSimpleField, Message, SimpleField, isArrayField,
} from '../models/Message';

export const createSchema = (message: Message): JSONSchema7 => {
	const createField = (
		field: Field,
		title: string,
		isArray = false,
	): JSONSchema7 => {
		if (isSimpleField(field)) {
			const simpleField: { [key: string]: JSONSchema7 } = {
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
			const mapField: { [key: string]: JSONSchema7 } = {
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

	return {
		properties: Object.keys(messageContent).reduce(
			(schema, schemaKey) => ({
				...schema,
				...createField(messageContent[schemaKey], schemaKey),
			}),
			{},
		),
	};
};

function getMessageContent(message: Message) {
	return message[Object.keys(message)[0]].content;
}

function parseValueType(field: SimpleField) {
	return field.valueType.toLowerCase() as 'string' | 'number' | 'boolean';
}

export function createInitialMessage(schema: Message) {
	try {
		const extractField = (field: Field, title: string, isArray = false): object => {
			if (!field.required) return {};
			if (isSimpleField(field)) {
				const allowedValues = Object.values(field.allowedValues);
				const value = field.defaultValue
					? field.defaultValue
					: allowedValues.length
						? allowedValues[0]
						: '';
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
							.filter(arrField => arrField.required)
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
		const regex = new RegExp('""', 'g');
		return JSON.stringify(result, null, 4).replace(regex, '');
	} catch (error) {
		console.error('Error occured while initating message');
		return null;
	}
}
