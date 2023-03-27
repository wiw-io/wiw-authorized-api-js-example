const axios = require('axios')
const FormData = require('form-data');
const http = require('http')
const url = require('url')
const {AxiosError} = require("axios");

// Use test client_id and client_secret
const CLIENT_ID = 'wiw-test-client'
const CLIENT_SECRET = 'wiw-test-secret'

// Start a basic http server on localhost:8888
const httpServer = http.createServer()
httpServer.listen(8888, () => {
    console.log(`basic server start at localhost:8888`)
})

// Listen to login or callback request
httpServer.on('request', async (request, response) => {
    const request_url = request.url
    console.log(`Request received for ${request_url}`)

    // Step 1: Redirect to WIW OAuth 2.0 server when receiving request to connect WIW
    if (request_url.startsWith('/login_wiw')) {
        response.statusCode = 302
        response.setHeader('Location', `https://api.wiw.io/oidc/authorize` +
            `?response_type=code` +
            `&client_id=${CLIENT_ID}` +
            '&scope=offline_access openid read:token' +
            `&redirect_uri=http://localhost:8888/authorize_success`)
        response.end()
    }

    // Step 3: Handle OAuth 2.0 server response
    else if (request_url.startsWith('/authorize_success')) {
        const callback = url.parse(request.url, true).query
        try {
            const authCode = callback.code
            let message = `OAuth server returns authorization code ${authCode}`
            let returnMessage = message
            console.log(message)

            // Step 4. Get access_token and refresh_token using authorization token
            let data = new FormData()
            data.append('grant_type', 'authorization_code')
            data.append('code', authCode)
            data.append('client_id', CLIENT_ID)
            data.append('client_secret', CLIENT_SECRET)
            data.append('redirect_uri', 'http://localhost:8888/authorize_success')
            let res = await axios.request({
                method: 'POST',
                url: `https://api.wiw.io/oidc/oauth/token`,
                headers: {'content-type': 'application/x-www-form-urlencoded'},
                data
            })
            let accessToken = res.data.access_token
            let refreshToken = res.data.refresh_token
            message = `Get token from authorization code:\nAccess token:${accessToken}\nRefresh token:${refreshToken}`
            returnMessage += `\n\n${message}`
            console.log(message)

            // Get new access_token using refresh token
            data = new FormData()
            data.append('grant_type', 'refresh_token')
            data.append('refresh_token', refreshToken)
            data.append('client_id', CLIENT_ID)
            data.append('client_secret', CLIENT_SECRET)
            data.append('redirect_uri', 'http://localhost:8888/authorize_success')
            res = await axios.request({
                method: 'POST',
                url: `https://api.wiw.io/oidc/oauth/token`,
                headers: {'content-type': 'application/x-www-form-urlencoded'},
                data
            })
            accessToken = res.data.access_token
            message = `Get new access token from refresh token:\nAccess token:${accessToken}`
            returnMessage += `\n\n${message}`
            console.log(message)

            // Call WIW authorized API using access token
            res = await axios.request({
                method: 'GET',
                url: `https://api.wiw.io/user/tokens/balance?addr=0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`,
                headers: {Authorization: `Bearer ${accessToken}`}
            })
            message = `Retrieve user ETH balance from API with access token ${accessToken}\n${JSON.stringify(res.data)}`
            returnMessage += `\n\n${message}`
            console.log(message)

            // Present the entire logs to the frontend
            response.statusCode = 200
            response.end(returnMessage)
        } catch (e) {
            response.statusCode = 500
            const error = (e instanceof AxiosError && e.response) ? e.response.data : e;
            response.end(JSON.stringify(error))
        }
    }

    // Other requests not supported
    else {
        const errorMessage = 'Url not supported by server'
        console.log(errorMessage)
        response.statusCode = 400
        response.end(errorMessage)
    }
})