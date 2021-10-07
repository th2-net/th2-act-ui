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

import React from 'react';
import '../styles/embedded-editor.scss';

export const EmbeddedEditor = (props: { schema: string; object: string }) => {
	const url = `/editor2/?schema=${props.schema}&${
		props.object && `object=${props.object}`
	}&editorMode=dictionaryEditor&embedded=true`;
	return <iframe className='embedded-editor' src={url}></iframe>;
};
