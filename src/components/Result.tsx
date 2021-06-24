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
import {
	ActSendingResponse,
	MessageSendingResponse,
	ParsedMessageSendingResponse,
} from '../models/Message';
import '../styles/result.scss';

const isDev = process.env.NODE_ENV === 'development';

const Result = ({ response }: { response: MessageSendingResponse | null }) => {
	if (!response) {
		return <div className='result' />;
	}

	const { code, message } = response;

	const parseContent = (): { link: string | null; content: string } => {
		try {
			const parsedContent = JSON.parse(message);
			const renderData = {
				link: getLink(parsedContent),
				content: JSON.stringify(parsedContent, null, 2),
			};
			return renderData;
		} catch (error) {
			return {
				link: null,
				content: message,
			};
		}
	};

	const getLink = (obj: unknown): string | null => {
		const rootLink = isDev
			? window.location.href.slice(0, window.location.href.lastIndexOf('/'))
			: window.location.href.substring(0, window.location.href.indexOf('/act-ui'));

		let eventId: null | string = null;

		try {
			if (typeof obj === 'object' && obj !== null && 'eventId' in obj) {
				eventId = (obj as ActSendingResponse | ParsedMessageSendingResponse).eventId;
			}
			return eventId ? `${rootLink}/?eventId=${eventId}` : null;
		} catch (error) {
			return null;
		}
	};

	const { link, content } = parseContent();

	return (
		<div className={`result ${code === 200 ? 'ok' : 'error'}`}>
			<pre className='result-value'>
				{link && (
					<>
						<div>Message is sent successfully</div>
						<a href={link} rel='noreferrer' target='_blank'>
							report link
						</a>
					</>
				)}
				{content}
			</pre>
		</div>
	);
};

export default Result;
