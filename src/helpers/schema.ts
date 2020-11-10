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

import { Field } from '../models/Message';

export const createSchema = (messageSchema: any) => {
	const createField = (
		field: Field,
		title: string,
		isArrayField = false,
	): any => {
		if (field.type === 'simple') {
			const simpleField = {
				[title]: {
					type: field.valueType.toLowerCase(),
					required: field.required,
				},
			};
			if (field.allowedValues && Object.keys(field.allowedValues).length) {
				(simpleField as any)[title].enum = Object.values(field.allowedValues);
			}
			return simpleField;
		}

		if (field.type === 'map') {
			const mapField: any = {
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
			return isArrayField ? mapField[title] : mapField;
		}

		if (field.type === 'array') {
			return {
				[title]: {
					type: 'array',
					items: {
						...createField(field.value[0], 'dsa', true),
					},
				},
			};
		}

		return {};
	};

	return Object.keys(messageSchema).reduce(
		(prev, curr) => ({
			...prev,
			...createField(messageSchema[curr], curr),
		}),
		{},
	);
};
