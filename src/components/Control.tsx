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

import { observer } from 'mobx-react-lite';
import React from 'react';
import { useStore } from '../hooks/useStore';
import Select from './Select';

export type SchemaType = 'parsed-message' | 'raw-message' | 'act';

const Control = () => {
	const store = useStore();

	const controlConfigs = [
		{
			name: 'parsed-message',
			selects: [
				{
					label: 'Session',
					id: 'session',
					options: store.sessions,
					selected: store.selectedSession || '',
					onChange: (opt: string) => store.selectedSession = opt,
				},
				{
					label: 'Dictionary',
					id: 'dictionary',
					options: store.dictionaries,
					selected: store.selectedDictionaryName || '',
					onChange: (opt: string) => store.selectedDictionaryName = opt,
				},
				{
					label: 'Msg Type',
					id: 'msg-type',
					options: store.dictionary,
					selected: store.selectedMessageType || '',
					onChange: (opt: string) => store.selectedMessageType = opt,
				},
			],
		},
		{
			name: 'act',
			selects: [
				{
					label: 'Act',
					id: 'act',
					options: store.acts,
					selected: store.selectedActBox || '',
					onChange: (opt: string) => store.selectedActBox = opt,
				},
				{
					label: 'Service',
					id: 'service',
					options: store.services,
					selected: store.selectedService || '',
					onChange: (opt: string) => store.selectedService = opt,
				},
				{
					label: 'Method',
					id: 'method',
					options: store.serviceDetails
						? store.serviceDetails.methods.map(method => method.methodName)
						: [],
					selected: store.selectedMethod?.methodName || '',
					onChange: (methodName: string) =>
						store.selectedMethod = store.serviceDetails?.methods
							.find(method => method.methodName === methodName) || null,
				},
			],
		},
	];

	return (
		<>
			<div className="app__row">
				<h3 className="app__title">Send as</h3>
				{
					controlConfigs.map(config => (
						<label key={config.name} htmlFor={config.name}>
							<input
								type="radio"
								value={config.name}
								id={config.name}
								checked={config.name === store.selectedSchemaType}
								onChange={e => store.setSelectedSchemaType(e.target.value as SchemaType)}
								name="message-type"
							/>
							{
								config.name
									.split('-')
									.map(part => part.charAt(0).toUpperCase() + part.slice(1))
									.join(' ')
							}
						</label>
					))
				}
			</div>
			<div className="app__row">
				{
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					controlConfigs.find(config => config.name === store.selectedSchemaType)!.selects.map(props =>
						<Select key={props.id} {...props} />)
				}
			</div>
		</>
	);
};

export default observer(Control);