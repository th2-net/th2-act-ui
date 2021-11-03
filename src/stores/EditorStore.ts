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

import { action, computed, makeObservable, observable } from 'mobx';
import ParsedMessageOptionsStore from './options/ParsedMessageOptionsStore';
import ActOptionsStore from './options/ActOptionsStore';
import RootStore from './RootStore';

type Options = {
	parsedMessage: ParsedMessageOptionsStore;
	act: ActOptionsStore;
};

class EditorStore {
	code = '{}';

	options: Options = {
		parsedMessage: new ParsedMessageOptionsStore(),
		act: new ActOptionsStore(),
	};

	constructor(private readonly rootStore: RootStore) {
		makeObservable(this, {
			code: observable,
			currentOptionsStore: computed,
			setCode: action,
		});
	}

	get currentOptionsStore() {
		return this.options[this.rootStore.schemaType];
	}

	setCode = (newCode: string) => {
		this.code = newCode;
	};
}

export default EditorStore;
