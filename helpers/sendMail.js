import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()


const sendMail = async(emailId, mailSubject, content) =>{
    try{
        const transport = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth:{
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASSWORD
            }
            
        });
        const mailOptions ={
            from: process.env.SMTP_MAIL,
            to: emailId,
            subject: mailSubject,
            html : content
        }

        transport.sendMail(mailOptions,function(error, info){
            if(error){
                console.log(error)
            }
            else{
                console.log("Mail sent!!", info.response)
            }
        });

    }catch(error){
        console.log(error.message)
    }

}

export default sendMail