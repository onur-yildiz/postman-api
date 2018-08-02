const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const _ = require('lodash');
const { ObjectId } = require('mongodb');

require('./db/mongoose');
const { Request } = require('./models/request.model');
const { User } = require('./models/user.model');
const { Collection } = require('./models/collection.model');
const { authenticate } = require('./middleware/authenticate.middleware');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-auth'
  );
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Expose-Headers', '*');
  next();
});

app.get('/requests', authenticate, async (req, res) => {
  const requests = await Request.find({ _owner: req.user._id });
  try {
    res.status(200).send(requests);
  } catch (error) {
    res.status(400).send();
  }
});

app.delete('/request/:id', async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(404).send();
  }
  try {
    const request = await Request.findOneAndRemove({
      _id: id,
      _owner: req.user._id
    });
    if (!request) {
      return res.status(404).send();
    }
    res.status(200).send({ request });
  } catch (error) {
    res.status(400).send();
  }
});

app.post('/request', authenticate, async (req, res) => {
  const request = new Request({
    url: req.body.url,
    _owner: req.user._id,
    method: req.body.method ? req.body.method : 'GET'
    // headers: req.body.headers,
    // body: req.body.body,
  });
  try {
    await request.save();
    const responseReq = _.pick(request, ['url', 'method', 'date', '_id']);
    if (req.body.method !== 'GET') {
      return res.status(200).send({ req: responseReq });
    }
    https.get(request.url, response => {
      const startTime = new Date().getTime();
      let body = '';
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        const headers = response.headers;
        headers['content-length'] = body.length;
        const info = {
          status: response.statusCode,
          responseTime: new Date().getTime() - startTime,
          sizeKB: (headers['content-length'] / 1024).toFixed(2),
          headers,
          body
        };
        res.status(200).send({ req: responseReq, info });
      });
    });
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
});

// app.post('/requests', authenticate, (req, res) => {
//   const requests = req.body;
//   requests.forEach(request => {
//     try {
//       newRequest = new Request(_.pick(request, ['url', 'method']));
//       newRequest._owner = req.user._id;
//       console.log('oi');
//       newRequest.save();
//     } catch (error) {
//       return res.status(400).send();
//     }
//   });
//   const saveCount = requests.length;
//   res.status(200).send({ saveCount });
// });

app.get('/collections', authenticate, async (req, res) => {
  const collections = await Collection.find({ _owner: req.user._id });
  try {
    res.status(200).send(collections);
  } catch (error) {
    res.status(400).send();
  }
});

app.post('/collection', authenticate, async (req, res) => {
  const collection = new Collection({
    url: req.body.url,
    _owner: req.user._id,
    date: req.body.date,
    method: req.body.method
    // headers: req.body.headers,
    // body: req.body.body,
  });
  try {
    await collection.save();
    res.status(200).send();
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
});

// app.post('/collections', authenticate, async (req, res) => {
//   const collections = req.body;
//   collections.forEach(collection => {
//     newCollection = new Collection(_.pick(collection, ['url', 'method', '_owner' ]));
//   });
//  ...
// });

app.delete('/collection/:id', authenticate, async (req, res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(404).send();
  }
  try {
    const collection = Collection.findOneAndRemove({
      _id: id,
      _owner: req.user._id
    });
    if (!collection) {
      return res.status(404).send();
    }
    res.status(200).send({ collection });
  } catch (error) {
    res.status(400).send();
  }
});

app.post('/users', async (req, res) => {
  try {
    const user = new User(_.pick(req.body, ['email', 'password']));
    await user.save();
    const token = await user.generateAuthToken();
    res
      .status(200)
      .header('x-auth', token)
      .send();
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/users/login', async (req, res) => {
  try {
    const body = new User(_.pick(req.body, ['email', 'password']));
    const user = await User.findByCredentials(body.email, body.password);
    const token = await user.generateAuthToken();
    res
      .status(200)
      .header('x-auth', token)
      .send();
  } catch (error) {
    console.log(error);
    res.status(400).send();
  }
});

app.post('/users/logout', authenticate, async (req, res) => {
  try {
    await req.user.removeToken(req.token);
    res.status(200).send();
  } catch (error) {
    res.status(400).send();
  }
});

app.listen(port, () => {
  console.log(`Listening on port:${port}`);
});
