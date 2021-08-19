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
import SplashScreen from './SplashScreen';

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
					options: store.sessions.sort(),
					selected: store.selectedSession || '',
					disabled: store.isSessionsLoading,
					valid: store.isSchemaApplied ? !!store.selectedSession : true,
					onChange: (opt: string) => store.setSelectedSession(opt),
				},
				{
					label: 'Dictionary',
					id: 'dictionary',
					options: store.dictionaries.sort(),
					selected: store.selectedDictionaryName || '',
					disabled: store.isSessionsLoading || store.isDictionariesLoading,
					valid: store.isSchemaApplied ? !!store.selectedDictionaryName : true,
					onChange: (opt: string) => store.setDictionaryName(opt),
				},
				{
					label: 'Msg Type',
					id: 'msg-type',
					options: store.dictionary.sort(),
					selected: store.selectedMessageType || '',
					disabled:
						store.isSessionsLoading
						|| store.isDictionariesLoading
						|| store.isDictionaryLoading,
					valid: store.isSchemaApplied ? !!store.selectedMessageType : true,
					onChange: (opt: string) => store.setSelectedMessageType(opt),
				},
			],
		},
		{
			name: 'act',
			selects: [
				{
					label: 'Act',
					id: 'act',
					options: store.acts.sort(),
					selected: store.selectedActBox || '',
					disabled: store.isActsLoading,
					valid: store.isSchemaApplied ? !!store.selectedActBox : true,
					onChange: (opt: string) => store.setSelectedActBox(opt),
				},
				{
					label: 'Service',
					id: 'service',
					options: store.services.sort(),
					selected: store.selectedService || '',
					disabled: store.isActsLoading || store.isServicesLoading,
					valid: store.isSchemaApplied ? !!store.selectedService : true,
					onChange: (opt: string) => store.setSelectedService(opt),
				},
				{
					label: 'Method',
					id: 'method',
					options: store.serviceDetails
						? store.serviceDetails.methods.map(method => method.methodName).sort()
						: [],
					selected: store.selectedMethod?.methodName || '',
					disabled:
						store.isActsLoading || store.isServicesLoading || store.isMethodsLoading,
					valid: store.isSchemaApplied ? !!store.selectedMethod : true,
					onChange: (methodName: string) => store.setSelectedMethod(methodName),
				},
			],
		},
	];

	return (
		<>
			<div key='mode' className='app__row'>
				<h3 className='app__title'>Send as</h3>
				{controlConfigs.map(config => (
					<label key={config.name} htmlFor={config.name}>
						<input
							type='radio'
							value={config.name}
							id={config.name}
							checked={config.name === store.selectedSchemaType}
							onChange={e =>
								store.setSelectedSchemaType(e.target.value as SchemaType)
							}
							name='message-type'
						/>
						{config.name
							.split('-')
							.map(part => part.charAt(0).toUpperCase() + part.slice(1))
							.join(' ')}
					</label>
				))}
			</div>
			<div key='parameters' className='app__row app__controls'>
				{
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					controlConfigs
						.find(config => config.name === store.selectedSchemaType)!
						.selects.map(props => (
							<React.Fragment key={props.id}>
								<Select {...props} />
								{props.disabled && <SplashScreen key='splash' />}
							</React.Fragment>
						))
				}

				{store.isSchemaLoading && <SplashScreen />}
			</div>
		</>
	);
};

export default observer(Control);
