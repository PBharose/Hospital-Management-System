import nodemailer from 'nodemailer'
const {SMTP_MAIL,SMTP_PASSWORD} = process.env

const sendMail = async(email,mailSubject,content)=>{
    try{
       const transport =  nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:SMTP_MAIL,
                pass:SMTP_PASSWORD
            }
        });
        const mailOptions={
            from:SMTP_MAIL,
            to:email,
            subject:mailSubject,
            html: content
        }
        transport.sendMail(mailOptions,(err,info)=>{
            if(err) throw err
            else{
                console.log('Mail send successfully', info.response)
            }
        })
    }catch(err){
        console.log(err.message)
    }
}
export default sendMail