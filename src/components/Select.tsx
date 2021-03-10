/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import '../styles/select.scss';

interface Props {
    className?: string;
    options: string[];
    selected: string;
	disabled: boolean;
    prefix?: string;
	onChange: (option: string) => void;
	label?: string;
	id?: string;
}

export default function Select({
	options,
	selected,
	disabled,
	onChange,
	className = '',
	label,
	id,
}: Props) {
	return (
		<div className="options-select__root">
			{label && <label className="options-select__label" htmlFor={id}>{label}</label>}
			<select
				className={`options-select ${className}`}
				id={id}
				value={selected}
				disabled={disabled}
				onChange={e => onChange(e.target.value)}>
				<option label="" />
				{
					options.map((opt, index) => (
						<option key={index}>{opt}</option>
					))
				}
			</select>
		</div>
	);
}
