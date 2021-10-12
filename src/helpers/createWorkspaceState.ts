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

const createWorkspaceState = (eventId: string) => [
	{
		events: {
			filter: {
				attachedMessageId: {
					type: 'string',
					negative: false,
					values: '',
				},
				type: {
					type: 'string[]',
					values: [],
					negative: false,
				},
				name: {
					type: 'string[]',
					values: [],
					negative: false,
				},
				body: {
					type: 'string[]',
					values: [],
					negative: false,
				},
				status: {
					type: 'switcher',
					values: 'any',
				},
			},
			panelArea: 50,
			selectedEventId: eventId,
			flattenedListView: false,
		},
		layout: [50, 50],
	},
];

export default createWorkspaceState;
