import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename)
var swagger_path = path.join(__dirname,'./swagger.yaml')
console.log(swagger_path)

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Medical Centric application',
            version: '1.0.0'
        },
        servers: [
            {
                url: 'http://localhost:3000/'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        },
        security: [{
            bearerAuth: []
        }],
    },
    apis: [swagger_path]
    
}
export default options