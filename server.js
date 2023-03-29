import express from 'express';
import dotenv from 'dotenv'
import bodyParser from 'body-parser';
import { google } from 'googleapis'
import credentials from './credentials.json' assert {type: "json"};
const client_id = credentials.web.client_id;
const client_secret = credentials.web.client_secret;
const redirect_uris = credentials.web.redirect_uris;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive']

dotenv.config()

import notFoundMiddleware from './middleware/not-found.js';
import errorHandlerMiddleware from './middleware/error-handler.js';
import cors from 'cors';
const app = express();

//db
import db from './db/connect.js'
db.connect(function (error) {
  if (error) throw (error)
  else console.log("DB connected successfully!!")
})

//router
import userRouter from './routes/userRoutes.js'
import patientRouter from './routes/patientRoutes.js'
import doctorRouter from './routes/doctorRoutes.js'

//middleware
notFoundMiddleware
errorHandlerMiddleware

app.use(express.json())

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


 import swaggerJSDoc from 'swagger-jsdoc';
 import swaggerUi from 'swagger-ui-express'
import options from './Swagger-doc/app.js'
// const options ={
//   definition:{
//     openapi:'3.0.0',
//     info:{
//         title:'Medical Centric application',
//         version:'1.0.0'
//     },
//     servers:[
//       {
//         url:'http://localhost:3000/'
//       }
//     ],
//     components:{
//       securitySchemes:{
//         bearerAuth:{
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//         }
//       }
//     },
//     security:[{
//       bearerAuth:[]
//     }],
//   },
//   apis:['server.js','./routes/*.js']
// }

 const swaggerSpec = swaggerJSDoc(options)
 app.use('/api/v1/swagger',swaggerUi.serve,swaggerUi.setup(swaggerSpec))


app.get('/', (req, res) => {
  res.send('Welcome!');
});

app.get('/getAuthURL', (req, res) => {
  const authURL = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPE,
  });
  console.log(authURL);
  return res.send(authURL);
});

app.post('/getToken', (req, res) => {
  oAuth2Client.getToken('4%2F0AWtgzh7nCU_M4YMqtzzXMgXhFanA_OL_aFsG5b-38a6P6tB4Gyi629W1AWMW85H2zAwarw', (err, token) => {
    if (err) {
      console.error('Error in retrieving access token', err);
      return res.status(400).send('Error in retrieving access token');
    }
    res.send(token)
  });
});

app.use('/api/v1/user', userRouter)
app.use('/api/v1/patient', patientRouter)
app.use('/api/v1/doctor', doctorRouter)

app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
});
