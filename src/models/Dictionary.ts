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

export type Dictionary = Array<string>;

export type DictionaryEntity = {
	kind: 'Th2Dictionary';
	name: string;
	spec: {
		data: string;
	};
};

export type DictionaryRequestPayload = {
	operation: 'add' | 'update' | 'remove';
	payload: DictionaryEntity;
};

export const isDictionaryEntity = (object: unknown): object is DictionaryEntity =>
	typeof object === 'object' && object !== null && (object as DictionaryEntity).kind === 'Th2Dictionary';
