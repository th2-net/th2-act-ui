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
import { AppliedReplacement, ReplacementConfig, ReplayItem } from '../models/Message';
import { JSMPathToJsonPath } from './jsonPath';
import getValueFromReplayListByJSMPath from './getValueFromReplayListByJSMPath';

const applyReplacements = (
	message: object,
	replacements: ReplacementConfig[],
	replayList: ReplayItem[],
): AppliedReplacement[] => {
	const appliedReplacements: AppliedReplacement[] = [];

	replacements.forEach(({ destinationPath, sourcePath }) => {
		jp.apply(message, JSMPathToJsonPath(destinationPath), () => {
			const sourceValue = getValueFromReplayListByJSMPath(replayList, sourcePath);

			appliedReplacements.push({
				destinationPath,
				sourcePath,
				originalValue: jp.value(message, JSMPathToJsonPath(destinationPath)),
				newValue: sourceValue,
			});

			return sourceValue;
		});
	});

	return appliedReplacements;
};

export default applyReplacements;
