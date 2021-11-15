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

import jp from 'jsonpath';
import { ReplacementConfig, ReplayItem } from '../models/Message';
import { JSMPathToJsonPath } from './jsonPath';

const applyReplacements = (message: object, replacements: ReplacementConfig[], replayList: ReplayItem[]) => {
	replacements.forEach(({ destinationPath, sourcePath }) => {
		jp.apply(message, JSMPathToJsonPath(destinationPath), () => {
			const pathArray = sourcePath.split('/').slice(1);
			const sourceReplayItemIndex = parseInt(pathArray[0]);
			const pathToSource = JSMPathToJsonPath(`/${pathArray.slice(1).join('/')}`);

			const responseMessage = JSON.parse(replayList[sourceReplayItemIndex].status.response?.message || '{}');

			return jp.value(responseMessage, pathToSource);
		});
	});
};

export default applyReplacements;
