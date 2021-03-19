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
import { MessageSendingResponse, ParsedMessageSendingResponse } from '../models/Message';
import '../styles/result.scss';

const isDev = process.env.NODE_ENV === 'development';

const Result = ({
	response,
}: { response: MessageSendingResponse | null }) => {
	if (!response) {
		return (
			<div className='result' />
		);
	}

	const { code, message } = response;

	const queryParameter: string | null = (() => {
		try {
			const data: ParsedMessageSendingResponse = JSON.parse(message);
			const currentTime = new Date().getTime();
			const filterValueFrom = currentTime - (60 * 1000);
			const filterValueTo = currentTime + (60 * 1000);

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

			return Buffer.from(
				JSON.stringify(queryParameterObject),
			).toString('base64');
		} catch (e) {
			console.error(e);
			return null;
		}
	})();

	const rootLink = isDev
		? 'localhost:9000'
		: window.location.href
			.substring(0, window.location.href.indexOf('/act-ui'));

	return (

		<div className={`result ${code === 200 ? 'ok' : 'error'}`}>
			<pre className="result-value">
				{queryParameter !== null ? (
					<>
						<div>
							Message is sent successfully
						</div>
						<a href={`${rootLink}/?workspaces=${queryParameter}`}
						   rel="noreferrer"
						   target="_blank">report link</a>
					</>
				) : null}
				{message}
			</pre>
		</div>
	);
};

export default Result;
