export const downloadFile = (content: string, filename: string, extension: string) => {
	const file = new Blob([content], { type: extension });

	if (window.navigator.msSaveOrOpenBlob) {
		window.navigator.msSaveOrOpenBlob(file);
	} else {
		const a = document.createElement('a');
		const url = URL.createObjectURL(file);
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	}
};
