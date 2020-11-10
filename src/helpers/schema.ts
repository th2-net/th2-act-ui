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

export const createSchema = (messageSchema: any) => {
	const lvl: any = {};
	Object.keys(messageSchema)
		.forEach(key => {
			if (messageSchema[key].type === 'simple') {
				lvl[key] = {
					type: (messageSchema[key] as any).valueType.toLowerCase(),
				};
				if (messageSchema[key].allowedValues && Object.keys(messageSchema[key].allowedValues).length) {
					lvl[key] = {
						...lvl[key],
						enum: Object.values(messageSchema[key].allowedValues),
					};
				}
			}

			if (messageSchema[key].type === 'map') {
				lvl[key] = {
					type: 'object',
					properties: createSchema(messageSchema[key].value as any),
				};
			}
		});

	return lvl;
};
