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

import React from 'react';
import '../styles/result.scss';

const Result = ({
	code,
	message,
}: { code: number; message: string }) => {
	let queryParameter: string | null = null;

	if (message !== null) {
		try {
			const data: {
				eventId: string;
				session: string;
				dictionary: string;
				messageType: string;
			} = JSON.parse(message);

			const currentTime = new Date().getTime();

			const filterValueFrom = currentTime - (60 * 1000);
			const filterValueTo = currentTime + (60 * 1000);

			// eslint-disable-next-line no-console
			console.log(currentTime);
			console.log(filterValueFrom);
			console.log(filterValueTo);

			const queryParameterObject = [
				{
					events: {
						filter: {
							eventTypes: ['act-ui'],
							names: [],
							timestampFrom: filterValueFrom,
							timestampTo: filterValueTo,
						},
						panelArea: 50,
						selectedNodesPath: [
							data.eventId,
						],
						flattenedListView: true,
					},
					messages: {
						timestampFrom: filterValueFrom,
						timestampTo: filterValueTo,
					},
					timeRange: [
						filterValueFrom,
						filterValueTo,
					],
					interval: 1,
					layout: [
						50,
						50,
					],
				},
			];

			queryParameter = Buffer.from(JSON.stringify(queryParameterObject)).toString('base64');
		} catch (e) {
			queryParameter = null;
			// eslint-disable-next-line no-console
			console.error(e);
		}
	}

	return (

		<div className={`result ${code === 200 ? 'ok' : 'error'}`}>
			<pre>
				{queryParameter !== null ? (
					<a href={`https://th2-qa:30443/testviewer/?workspaces=${queryParameter}`}
					   rel="noreferrer"
					   target="_blank">report link</a>
				) : null}
				{message}
			</pre>
		</div>
	);
};

export default Result;
