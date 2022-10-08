const axios = require('axios')
const http = require('http')
const url = require('url')

// Use test client_id and client_secret
const CLIENT_ID = '4s4CzaDQFhVkacBqhvyeBEL4lkucvVfH'
const CLIENT_SECRET = '_rbEkQQMui76oAT1Y_CUcETex5MEvkIsrkfvLmYa7OZm0g51xozpdpQD-X6e2jT5'

// Start a basic http server on localhost:8001
const httpServer = http.createServer()
httpServer.listen(8001, () => {
    console.log(`basic server start at localhost:8001`)
})

// Listen to login or callback request
httpServer.on('request', async (request, response) => {
    const request_url = request.url
    console.log(`Request received for ${request_url}`)

    // Step 1: Redirect to WIW OAuth 2.0 server when receiving request to connect WIW
    if (request_url.startsWith('/login_wiw')) {
        response.statusCode = 302
        response.setHeader('Location', `https://login.wiw.io/authorize` +
            `?audience=https://api.wiw.io` +
            '&scope=offline_access read:profile' +
            '&response_type=code' +
            `&client_id=${CLIENT_ID}` +
            `&connection=mask` +
            `&redirect_uri=http://localhost:8001/authorize_success`)
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
            let res = await axios.request({
                method: 'POST',
                url: `https://login.wiw.io/oauth/token`,
                headers: {'content-type': 'application/json'},
                data: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: authCode,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: "http://localhost:8001/authorize_success"
                })
            })
            let accessToken = res.data.access_token
            let refreshToken = res.data.refresh_token
            message = `Get token from authorization code:\nAccess token:${accessToken}\nRefresh token:${refreshToken}`
            returnMessage += `\n\n${message}`
            console.log(message)

            // Get new access_token using refresh token
            res = await axios.request({
                method: 'POST',
                url: `https://login.wiw.io/oauth/token`,
                headers: {'content-type': 'application/json'},
                data: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET
                })
            })
            accessToken = res.data.access_token
            message = `Get new access token from refresh token:\nAccess token:${accessToken}`
            returnMessage += `\n\n${message}`
            console.log(message)

            // Call WIW authorized API using access token
            res = await axios.request({
                method: 'GET',
                url: `https://api.wiw.io/mask/profile`,
                headers: {Authorization: `Bearer ${accessToken}`}
            })
            message = `Retrieve data from /mask/profile API with access token ${accessToken}\n${JSON.stringify(res.data)}`
            returnMessage += `\n\n${message}`
            console.log(message)

            // Present the entire logs to the frontend
            response.statusCode = 200
            response.end(returnMessage)
        } catch (e) {
            response.statusCode = 500
            response.end(e)
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