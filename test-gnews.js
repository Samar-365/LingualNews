import axios from 'axios';
const API_KEY = '9205f3f84e363c9b5237e1b605d78e29';

async function testGnews(lang) {
    try {
        const res = await axios.get('https://gnews.io/api/v4/top-headlines', {
            params: {
                category: 'general',
                lang: lang,
                max: 10,
                apikey: API_KEY
            }
        });
        console.log(`Lang [${lang}]: ${res.data.articles.length} articles found`);
        if (res.data.articles.length > 0) {
            console.log(` - Example: ${res.data.articles[0].title}`);
        }
    } catch (e) {
        console.log(`Lang [${lang}] error:`, e.response?.data?.errors || e.message);
    }
}

async function run() {
    await testGnews('hi');
    await testGnews('mr');
    await testGnews('ja');
    await testGnews('es');
    await testGnews('pt');
    await testGnews('en');
    await testGnews('fr');
    await testGnews('de');
}

run();
