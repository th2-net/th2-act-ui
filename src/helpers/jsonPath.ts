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

export const JSMPathToJsonPath = (path: string) =>
	path === ''
		? '$'
		: `$${path
				.split('/')
				.filter(x => x)
				.map(x => (/^[0-9]+$/.test(x) ? `[${x}]` : `.${x}`))
				.join('')}`;

export const jsonPathToJSMPath = (path: string) =>
	path === '$'
		? ''
		: `/${path
				.split(/(\.|\[[0-9]+])/)
				.slice(2)
				.filter(x => x && x !== '.')
				.map(x => (/\[[0-9]+]/.test(x) ? Array.from(x).slice(1, -1).join('') : x))
				.join('/')}`;
