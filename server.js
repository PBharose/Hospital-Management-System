import express from 'express';
import dotenv from 'dotenv'
dotenv.config()

import notFoundMiddleware from './middleware/not-found.js';
import errorHandlerMiddleware from './middleware/error-handler.js';
const app = express();

//db
import db from './db/connect.js'
db.connect(function(error){
    if(error) throw (error)
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

app.get('/', (req, res) => {
  res.send('Welcome!');
});
app.use('/user',userRouter)
app.use('/patient',patientRouter)
app.use('/doctor', doctorRouter)
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`)
});