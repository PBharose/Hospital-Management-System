import config from '../config.json' assert {type: "json"}

const auth = async(req,res,next) => {
    try{
        if(
            !req.headers.authorization ||
            !req.headers.authorization.startsWith('Bearer') ||
            !req.headers.authorization.split(' ')[1]
        ){
            return res.status(422).json({
                message: "Please provide token"
            });
        }
        next();
    }catch(error){
       return res.status(config.error.internalServerError.statusCode).send(config.error.internalServerError)
    }
}

export default auth