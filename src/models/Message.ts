/** *****************************************************************************
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

export interface Message {
	[messageType: string]: {
		type: 'messagePattern';
		name: string;
		content: {
			[key: string]: SimpleField | MapField | ArrayField;
		};
	};
}

export type MessageFieldBase = {
	type: 'simple' | 'array' | 'map';
	name: string;
	required: boolean;
};

export type FieldValueType = 'STRING' | 'NUMBER' | 'BOOLEAN';

export type SimpleField = MessageFieldBase & {
	type: 'simple';
	valueType: FieldValueType;
	defaultValue: null | string | number | boolean;
	allowedValues: {
		[messageType: string]: string | number | boolean;
	};
};

export type Field = SimpleField | MapField | ArrayField;

export type ArrayField = MessageFieldBase & {
	type: 'array';
	value: Array<SimpleField | MapField>;
};

export type MapField = MessageFieldBase & {
	type: 'map';
	value: {
		[key: string]: SimpleField | MapField | ArrayField;
	};
};

export function isSimpleField(field: Field): field is SimpleField {
	return field.type === 'simple';
}

export function isMapField(field: Field): field is MapField {
	return field.type === 'map';
}

export function isArrayField(field: Field): field is ArrayField {
	return field.type === 'array';
}
