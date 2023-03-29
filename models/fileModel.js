import { google } from 'googleapis'
import OAuth2Data from '../credentials.json' assert {type: "json"}
import open from 'open';

const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URI = OAuth2Data.web.redirect_uris[0];

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
)
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile"

const drive = google.drive({
    version: 'v3',
    auth: oAuth2Client
})

const authorizationUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    include_granted_scopes: true
});
let tokens = null

const getCode = async (req, res) => {
    const code = req.query.code
    if (code) {
        tokens = await oAuth2Client.getToken(code);
        //console.log(tokens)
        res.redirect('/')
    }
}

const deleteFile = async (fileId,res)=>{
    try{
        await drive.files.delete({
            fileId:fileId
        });
    }
    catch(error){
        console.log(error.message)
    }
}
const downloadFile = async (fileId,res) =>{
    try{
        await drive.permissions.create({
            fileId: fileId,
            requestBody:{
                role: "reader",
                type:"anyone"
            }
        });
        const link = await drive.files.get({
             fileId: fileId,
             fields: 'webViewLink, webContentLink',   
        });
        
        open(link.data.webContentLink);
        
    }catch(error){
        console.log(error.message)
    }
}

export {getCode,authorizationUrl,tokens,oAuth2Client,drive,deleteFile,downloadFile}