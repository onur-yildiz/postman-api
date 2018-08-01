const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const _ = require('lodash');
const { ObjectId } = require('mongodb');
var Cookies = require('cookies');

require('./db/mongoose');
const { Request } = require('./models/request.model');
const { User } = require('./models/user.model');
const { authenticate } = require('./middleware/authenticate.middleware');

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.get('/requests', authenticate, async (req, res) => {
  const requests = await Request.find({ _owner: req.user._id });
  try {
    res.status(200).send({ requests });
  } catch (error) {
    res.status(400).send();
  }
});

// app.get('/request/:id', async (req, res) => {
//   const id = req.params.id;
//   if (!ObjectId.isValid(id)) {
//     return res.status(404).send();
//   }
//   try {
//     const request = await Request.find({ _id: id, _owner: req.user._id });
//     if (!request) {
//       return res.status(404).send();
//     }
//     res.status(200).send({ request });
//   } catch (error) {
//     res.status(400).send();
//   }
// });

app.post('/request', authenticate, async (req, res) => {
  const request = new Request({
    url: req.body.url,
    type: req.body.type,
    _owner: req.user._id,
    date: new Date() /*  DEFINED AS DEFAULT CHECK IT LATER IF IT WORKS LIKE THAT */
  });
  try {
    await request.save();
    https.get(request.url, response => {
      const headers = response.headers;
      let body = '';
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        res.status(200).send({ body, headers });
      });
    });
  } catch (error) {
    console.log(error);
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
    const user = new User(_.pick(req.body, ['email', 'password']));
    await User.findbyCredentials(user.email, user.password);
    const token = await user.generateAuthToken();
    res
      .status(200)
      .header('x-auth', token)
      .send();
  } catch (error) {
    res.status(400).send();
  }
});

app.listen(port, () => {
  console.log(`Listening on port:${port}`);
});
