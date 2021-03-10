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

import { Dictionary } from '../models/Dictionary';
import {
	JSONSchemaResponce,
	MessageRequestModel,
	MethodCallRequestModel,
	ParsedMessage,
} from '../models/Message';
import Service from '../models/Service';

const api = {
	async getDictionaryList(): Promise<string[]> {
		const dictionariesResponse = await fetch('backend/dictionaries', {
			cache: 'no-cache',
		});

		if (dictionariesResponse.ok) {
			return dictionariesResponse.json();
		}

		console.error(dictionariesResponse.statusText);
		return [];
	},
	async getSessions(): Promise<string[]> {
		const sessionsResponse = await fetch('backend/sessions', {
			cache: 'no-cache',
		});

		if (sessionsResponse.ok) {
			return sessionsResponse.json();
		}

		console.error(sessionsResponse.statusText);
		return [];
	},
	async getDictionary(dictionaryName: string): Promise<Dictionary> {
		const dictionaryResponse = await fetch(`backend/${dictionaryName}`, {
			cache: 'no-cache',
		});

		if (dictionaryResponse.ok) {
			return dictionaryResponse.json();
		}

		console.error(dictionaryResponse.statusText);
		return [];
	},
	async getMessage(messageType: string, dictionaryName: string): Promise<ParsedMessage | null> {
		const messageResponse = await fetch(`backend/${dictionaryName}/${messageType}`);

		if (messageResponse.ok) {
			return messageResponse.json();
		}

		console.error(messageResponse.statusText);
		return null;
	},

	async sendMessage(request: MessageRequestModel): Promise<Response> {
		const res = await fetch(

			// eslint-disable-next-line max-len
			`backend/message/?session=${request.session}&dictionary=${request.dictionary}&messageType=${request.messageType}`,

			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request.message),
			},
		);

		if (!res.ok) {
			console.error(res);
		}

		return res;
	},

	async getActsList(): Promise<string[]> {
		const actsResponse = await fetch('backend/acts', {
			cache: 'no-cache',
		});

		if (actsResponse.ok) {
			return actsResponse.json();
		}

		console.error(actsResponse.statusText);
		return [];
	},
	async getServices(actBox: string): Promise<string[]> {
		const servicesResponse = await fetch(`backend/services/${actBox}`, {
			cache: 'no-cache',
		});

		if (servicesResponse.ok) {
			return servicesResponse.json();
		}

		console.error(servicesResponse.statusText);
		return [];
	},
	async getServiceDetails(serviceName: string): Promise<Service | null> {
		const servicesResponse = await fetch(`backend/service/${serviceName}`, {
			cache: 'no-cache',
		});

		if (servicesResponse.ok) {
			return servicesResponse.json();
		}

		console.error(servicesResponse.statusText);
		return null;
	},
	async getActSchema(serviceName: string, methodName: string): Promise<JSONSchemaResponce | null> {
		const schemaResponse = await fetch(`backend/json_schema/${serviceName}/?method=${methodName}`, {
			cache: 'no-cache',
		});

		if (schemaResponse.ok) {
			return schemaResponse.json();
		}

		console.error(schemaResponse.statusText);
		return null;
	},
	async callMethod(request: MethodCallRequestModel): Promise<void> {
		const res = await fetch(
			`backend/method/?fullServiceName=${request.fullServiceName}&methodName=${request.methodName}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request.message),
			},
		);

		if (!res.ok) {
			console.error(res);
		}
	},
};

export default api;
