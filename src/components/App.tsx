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

import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import { observer } from 'mobx-react-lite';
import Select from './Select';
import Result from './Result';
import Button from './Button';
import '../styles/root.scss';
import MessageEditor from './MessageEditor';
import { useStore } from '../hooks/useStore';
import { Message } from '../models/Message';

const App = () => {
	const store = useStore();

	return (
		<div className="app">
			<div className="app__header">
				<h3 className="app__title">Configuration</h3>
				<Select
					label="Sessions"
					id="sessions"
					options={[]}
					selected={''}
					// eslint-disable-next-line no-console
					onChange={opt => console.log(opt)}/>
				<Select
					label="Dictionaries"
					id="dictionaries"
					options={[]}
					selected={''}
					// eslint-disable-next-line no-console
					onChange={opt => console.log(opt)}/>
			</div>
			<div className="app__body">
				<div className="app__row">
					<h3 className="app__title">Send as</h3>
					<label htmlFor="parsed-message">
						<input type="radio" value="Parsed Message" id="parsed-message"/>
						Parsed Message
					</label>
					<label htmlFor="raw-message">
						<input type="radio" value="Raw Message" id="raw-message"/>
						Raw Message
					</label>
					<label htmlFor="act">
						<input type="radio" value="Act" id="act"/>
						Act
					</label>
				</div>
				<div className="app__row">
					<Select
						label="Session"
						id="session"
						options={[]}
						selected={''}
						// eslint-disable-next-line no-console
						onChange={opt => {
							console.log(opt);
						}}/>
					<Select
						label="Dictionary"
						id="dictionary"
						options={store.dictionaries}
						selected={store.selectedDictionaryName || ''}
						onChange={opt => store.selectedDictionaryName = opt}/>
					<Select
						label="Msg Type"
						id="msg-type"
						options={store.dictionary}
						selected={store.selectedMessageType || ''}
						onChange={opt => store.selectedMessageType = opt}/>
				</div>
				<div className="app__editor">
					<MessageEditor messageSchema={store.message} />
				</div>
				<div className="app__buttons">
					<Button>
						<i className="clear-icon"></i>
						<span>Clear</span>
					</Button>
					<Button>
						<span>Send Message</span>
						<i className="arrow-right-icon"></i>
					</Button>
				</div>
				<div className="app__result">
					<h3 className="app__title">Result</h3>
					<Result />
				</div>
			</div>
		</div>
	);
};

export default hot(observer(App));
