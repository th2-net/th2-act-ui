/** ****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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

import { action, makeObservable, observable } from 'mobx';
import { AppliedReplacement, MessageSendingResponse, ReplacementConfig } from '../../models/Message';
import RootStore from '../RootStore';

export default abstract class MessagesStore<T> {
	isSending = false;

	messageSendingResponse: MessageSendingResponse | null = null;

	replacements: ReplacementConfig[] = [];

	appliedReplacements: AppliedReplacement[] = [];

	protected constructor(protected readonly rootStore: RootStore) {
		makeObservable(this, {
			isSending: observable,
			messageSendingResponse: observable,
			replacements: observable,
			appliedReplacements: observable,
			setReplacements: action,
		});
	}

	abstract sendMessage: (message: object) => void;

	setReplacements = (replacements: ReplacementConfig[]) => {
		this.replacements = replacements;
	};
}
