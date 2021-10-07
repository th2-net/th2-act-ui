/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const reorderArray = (
	destinationIndex: number,
	sourceIndex: number,
	draggableMessage: any,
	sourceArray: {array: any[]},
) => {
	const arrayCopy = sourceArray.array.slice();
	arrayCopy.splice(sourceIndex, 1);
	arrayCopy.splice(destinationIndex, 0, draggableMessage);
	for (let i = 0; i < arrayCopy.length; i++) {
		// eslint-disable-next-line no-param-reassign
		sourceArray.array[i] = arrayCopy[i];
	}
};
