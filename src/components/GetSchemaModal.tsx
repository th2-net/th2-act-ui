import { observer } from 'mobx-react-lite';
import React from 'react';
import api from '../api';
import { Dictionary } from '../models/Dictionary';
import '../styles/get-schema-modal.scss';

interface ModalProps {
	dictionaries: string[];
	closeModal: (value: boolean) => void;
	onSelect: (value: string) => void;
}

function GetSchemaModal({
	dictionaries,
	closeModal,
	onSelect,
}: ModalProps) {
	const [allOptions, setAllOptions] = React.useState<string[]>([]);
	const [suitableOptions, setSuitableOptions] = React.useState<string[]>([]);
	const map = new Map<string, Promise<Dictionary>>();

	const [value, setValue] = React.useState('');

	const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setValue(newValue);
		if (newValue !== '') {
			const variables = allOptions.sort().filter(option => option.toLowerCase().includes(newValue.toLowerCase()));
			if (variables.length > 0) {
				const temp = variables.slice(0, variables.length >= 10 ? 10 : variables.length);
				setSuitableOptions(temp);
			} else {
				setSuitableOptions([]);
			}
		} else {
			setSuitableOptions([]);
		}
		e.stopPropagation();
	};

	const getSchemaOnClickHandler = (event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
		event.stopPropagation();
		const currentValue = value;
		setValue('');
		onSelect(currentValue);
	};

	const cancelOnClickHandler = (event: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
		event.stopPropagation();
		closeModal(false);
	};

	React.useEffect(() => {
		const newVariables: string[] = [];
		dictionaries.forEach(dictionarieName => {
			map.set(dictionarieName, api.getDictionary(dictionarieName));
		});
		map.forEach((_value, key) => _value
			.then(res => res.forEach(methodName => newVariables.push(`${key} ${methodName}`))));
		setAllOptions(newVariables);
	}, [dictionaries]);

	return (
		<div className='modal-wrapper' onClick={cancelOnClickHandler}>
			<div className='modal-container' onClick={e => e.stopPropagation()}>
				<div className='modal-container__controls'>
					<input
						type='text'
						placeholder={'dictionary method'}
						value={value}
						onChange={onChangeHandler}
						ref={ref => ref?.focus()}
					/>
					<input type='button' value='Get schema' onClick={getSchemaOnClickHandler}/>
					<input type='button' value='Cancel' onClick={cancelOnClickHandler}/>
				</div>
				<div className='modal-container__results'>
					{
						value !== ''
						&& suitableOptions.map(option =>
							<div
								className='modal-container__search-result'
								key={option}
								onClick={e => {
									e.stopPropagation();
									setValue(option);
								}}>
								{option}
							</div>)
					}
				</div>
			</div>
		</div>
	);
}

export default observer(GetSchemaModal);
