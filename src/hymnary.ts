import { requestUrl } from 'obsidian';

export interface HymnResult {
	displayTitle: string;
	authors: string;
	firstLine: string;
	meter: string;
	textAuthNumber: string;
	hymnaryUrl: string;
}

export async function searchHymns(query: string): Promise<HymnResult[]> {
	const encoded = encodeURIComponent(query);
	const url = `https://hymnary.org/search?qu=${encoded}+in:texts&export=csv`;
	const response = await requestUrl({ url });
	return parseCSV(response.text);
}

function parseCSV(csv: string): HymnResult[] {
	const lines = csv.trim().split('\n');
	if (lines.length < 2) return [];

	const headers = splitCSVLine(lines[0] ?? '');

	return lines.slice(1).map(line => {
		const values = splitCSVLine(line);
		const obj: Record<string, string> = {};
		headers.forEach((h, i) => (obj[h.trim()] = (values[i] || '').trim()));
		return {
			displayTitle: obj['displayTitle'] || '',
			authors: obj['authors'] || '',
			firstLine: obj['firstLine'] || '',
			meter: obj['meter'] || '',
			textAuthNumber: obj['textAuthNumber'] || '',
			hymnaryUrl: obj['textAuthNumber']
				? `https://hymnary.org/text/${obj['textAuthNumber']}`
				: '',
		};
	}).filter(r => r.textAuthNumber);
}

function splitCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			inQuotes = !inQuotes;
		} else if (ch === ',' && !inQuotes) {
			result.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current);
	return result;
}

export async function fetchLyrics(textAuthNumber: string): Promise<string[]> {
	const url = `https://hymnary.org/text/${textAuthNumber}`;
	const response = await requestUrl({ url });
	const html = response.text;

	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');

	const columns = doc.querySelector('#at_fulltext .authority_columns');
	if (!columns) return [];

	const stanzas: string[] = [];
	const paragraphs = columns.querySelectorAll('p');

	paragraphs.forEach(p => {
		if (!p.querySelector('br')) return;

		// Replace <br> tags with newline text nodes
		p.querySelectorAll('br').forEach(br => {
			br.replaceWith(doc.createTextNode('\n'));
		});

		const lines = (p.textContent ?? '')
			.split('\n')
			.map(l => l.trim())
			.filter(l => l.length > 0);

		if (lines.length > 0) {
			stanzas.push(lines.join('\n'));
		}
	});

	return stanzas;
}
