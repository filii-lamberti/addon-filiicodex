// eslint-disable-next-line spaced-comment
//*
const hassioToken = process.env.HASSIO_TOKEN;

if (!hassioToken) {
  // eslint-disable-next-line no-console
  console.log('You are not running this as an Home Assistant add-on!');
  process.exit(1);
}

// Nodig voor externe files
const fs = require('fs');

// Here we import the options.json file
// from the add-on persistent data directory
// that contains our configuration
const options = JSON.parse(fs.readFileSync('/data/options.json', 'utf8'));

// status of logging
const { logging } = options;
// status of debugging
const { debugging } = options;
// Should I purge?
const { purge } = options;
// eslint-disable-next-line spaced-comment
/*/
const logging = true;
const debugging = false;
const purge = true;
// */

// function to filter console logs
function log(message) {
  if (logging) {
    // eslint-disable-next-line no-console
    console.log(message);
  }
}
// prints if logging is true
if (logging) {
  log('Logging is enabled');
}

// prints if debugging is true
if (debugging) {
  log('Debugging is enabled');
  process.env.DEBUG = '*';
}

// HTTP REST API
const axios = require('axios');

// prints if purge is true
if (purge) {
  log('Purging existing data');
  // and resets the value
  options.purge = false;

  axios.post('http://hassio/addons/self/options',
    {
      options,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-HASSIO-KEY': hassioToken,
      },
    })
    .then((response) => {
      // handle success
      log(response.data);
    })
    .catch((error) => {
      // handle error
      log(`Error: ${error}`);
    });
}

// Setup basic express server
const express = require('express');

const app = express();
// Constant for port
const port = process.env.PORT || 3000;

const xml2js = require('xml2js');
// Custom XML parser options
const parser = new xml2js.Parser({
  trim: true,
  explicitArray: false,
});

// Load Enmap
const Enmap = require('enmap');
// Normal enmap with default options but custom data location
const codex = new Enmap({
  name: 'codex',
  dataDir: '/data',
});

// Load Fuse
const Fuse = require('fuse.js');
// Fuse options
const fuseOptions = {
  default: {
    id: 'id',
    includeScore: true,
    keys: [
      'title',
      'text',
      'extraInfo',
      'year',
      'page',
      'musicalScore',
      'writers',
      'friendlyUrl',
    ],
  },
  title: {
    includeScore: true,
    keys: [
      'title',
    ],
  },
  text: {
    includeScore: true,
    keys: [
      'text',
    ],
  },
  year: {
    includeScore: true,
    keys: [
      'year',
    ],
  },
  page: {
    includeScore: true,
    keys: [
      'page',
    ],
  },
  writers: {
    includeScore: true,
    keys: [
      'writers',
    ],
  },
};
const searchTypes = Object.keys(fuseOptions);
const fuseSearch = {};
const loadSearch = () => {
  fuseSearch.default = new Fuse(codex.array(), fuseOptions.default);
  fuseSearch.title = new Fuse(codex.array(), fuseOptions.title);
  fuseSearch.text = new Fuse(codex.array(), fuseOptions.text);
  fuseSearch.year = new Fuse(codex.array(), fuseOptions.year);
  fuseSearch.page = new Fuse(codex.array(), fuseOptions.page);
  fuseSearch.writers = new Fuse(codex.array(), fuseOptions.writers);
};

const loadSongs = (datetime) => {
  const object = {};
  const jsonUrl = 'https://studentencodex.org/getsongs';

  axios.get(jsonUrl)
    .then((jsonResponse) => {
      // handle success
      const jsonSongs = jsonResponse.data.value;
      const jsonLength = jsonSongs.length;

      jsonSongs.forEach((song) => {
        object[song.Id] = `https://studentencodex.org/lied/${song.FriendlyUrl}`;
      });

      const datetimestring = datetime.toISOString().replace(/\..+/, '').replace(/[-T:]/g, '.');
      const xmlUrl = `https://studentencodex.org/codex/xml/codexsongsupdate/${datetimestring}`;

      axios.get(xmlUrl)
        .then((xmlResponse) => {
          // handle success

          parser.parseStringPromise(xmlResponse.data)
            .then((result) => {
              const xmlSongs = result.songs.song;
              let xmlLength = result.songs.summary.count;

              xmlSongs.forEach((song) => {
                if (song.action === 'insert') {
                  const obj = song;

                  delete obj.action;
                  obj.musicalScore = song.musicalScore.replace('http://', 'https://');
                  obj.friendlyUrl = object[song.id];

                  obj.html = {};
                  obj.html.text = song.text.replace(/\r\n/g, '<br>');
                  obj.html.extraInfo = song.extraInfo.replace(/\r\n/g, '<br>');
                  obj.html.writers = song.writers.replace(/\r\n/g, '<br>');

                  codex.set(song.id, obj);
                } else {
                  log(`Ignoring song ${song.id}, action was ${song.action}.`);
                  xmlLength -= 1;
                }
              });

              log(`json size is ${jsonLength} and xml size is ${xmlLength}`);
              loadSearch();
            })
            .catch((_error) => {
              // Failed
              log(`XML parser failed: ${_error}`);
            });
        })
        .catch((error) => {
          // handle error
          log('error in xml request');
          log(error);
        });
    })
    .catch((error) => {
      // handle error
      log('error in json request');
      log(error);
    });
};

// Wait for data to load
codex.defer.then(() => {
  if (purge) {
    codex.deleteAll();
  }

  if (codex.count === 0) {
    log('Codex is empty, updating now.');
    const epochdatetime = new Date(3600000);
    loadSongs(epochdatetime);
  } else {
    log('Codex not empty, current datetime is:');
    const currentdatetime = new Date();
    log(currentdatetime);
    loadSearch();
  }
});

app.get('/search/:type/:keyword', (req, res) => {
  // Reading type from the URL
  const type = searchTypes.includes(req.params.type) ? req.params.type : 'default';
  log(`Search type: ${type}`);
  // Reading keyword from the URL
  const { keyword } = req.params;
  log(`Search keyword: ${keyword}`);
  const limit = req.query.limit === 'undefined' ? 5 : Number(req.query.limit) || 5;
  log(`Search limit: ${limit}`);
  const results = fuseSearch[type].search(keyword, { limit });
  res.json(results);
});

app.get('/id/:id', (req, res) => {
  // Reading keyword from the URL
  const { id } = req.params;
  const result = codex.get(id);
  res.json(result);
});

// Launch listening server on port 3000
app.listen(port, () => {
  log(`listening on port ${port}!`);
});
