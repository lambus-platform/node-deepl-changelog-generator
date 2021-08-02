require('dotenv').config(); // Load env variables

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const text = fs.readFileSync(path.join('CHANGELOG_BASE.txt'), { encoding: 'utf-8' }).toString();

const languages = require('./languages.json'); // See "target_lang" in https://www.deepl.com/de/docs-api/translating-text/

(async () => {
    try {
        const requests = [];

        for (const language of languages) {
            const apiURL = `https://api-free.deepl.com/v2/translate?auth_key=${DEEPL_API_KEY}&text=${text}&target_lang=${language.toUpperCase()}&formality=less`;
            requests.push(axios.get(apiURL));
        }

        const results = await Promise.all(requests);
        handleResults(results);
    } catch (error) {
        console.error(`Could not get data: ${error.message}`);
    }
})();

function handleResults(results) {
    const mapped = results.map((result, index) => ({ [languages[index]]: result.data.translations[0].text }));
    const translations = Object.assign({ en: text }, { hi: text }, ...mapped);
    const formattedOutput = Object.keys(translations).map(key => {
        const formattedKey = key.includes('-') ? key : `${key}-${key.toUpperCase()}`;
        return `
<${formattedKey}>
${translations[key]}
</${formattedKey}>
`
    });

    fs.writeFileSync(path.join('CHANGELOG_ALL.txt'), formattedOutput.join(''), { encoding: 'utf-8' });
    console.warn(`Translated changelog to ${formattedOutput.length} languages! ✨ See CHANGELOG_ALL.txt for details!`);
}
