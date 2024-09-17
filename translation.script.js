const readline = require('node:readline');
const fs = require('node:fs');

const CONFIGS = {
  Authorization: '',
  callbackUrl: 'callback here',
  specialChars: /[^\w\s]/,
};

const targetLanguages = ['en', 'hi', 'pa', 'mr']; //list of languages

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.question(`Enter word to translate: `, async name => {
  let key = sanitizeAndCapitalize(name);
  targetLanguages.forEach(async (e, i) => {
    let value = await translateFn(name, e);
    fs.readFile(`./translations/${e}.json`, function (err, data) {
      if (err) throw err;
      const json = JSON.parse(data);
      json[key] = value;
      fs.writeFile(
        `./translations/${e}.json`,
        JSON.stringify(json, null, 4),
        err => {
          if (err) console.log(err);
          console.log(`${e} file written succesfully`);
        },
      );
    });
  });
  rl.close();
});

function sanitizeAndCapitalize(str) {
  let j = str
    .toUpperCase()
    .replaceAll(' ', '_')
    .replace(CONFIGS.specialChars, '')
    .replaceAll('\n', '_')
    .trim();
  return j;
}

const translateFn = async (str, language) => {
  let targetLanguage = 'hi';
  if (str) {
    let body = {
      pipelineTasks: [
        {
          taskType: 'translation',
          config: {
            language: {
              sourceLanguage: 'en',
              targetLanguage: language,
            },
          },
        },
      ],
      inputData: {
        input: [
          {
            source: str,
          },
        ],
      },
    };

    let headers = {
      ['Content-Type']: 'application/json',
      ['Authorization']: CONFIGS.Authorization,
    };
    let url = CONFIGS.callbackUrl;

    try {
      const data = await fetch(url, {
        headers: headers,
        body: JSON.stringify(body),
        method: 'POST',
      });
      if (data.ok) {
        const json = await data.json();
        return json?.pipelineResponse[0]?.output[0]?.target;
      } else {
        console.log('bhasini data not ok', body, await data.json());
        return str;
      }
    } catch (error) {
      console.log('bhasini error', error);
    }
  } else return str;
};
