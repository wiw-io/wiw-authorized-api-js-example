# wiw-authorized-api-js-example

[WIW Documentation](https://docs.wiw.io/build-with-wiw/authorized-api/complete-code-example)

This repository is a minimal *Node.js* application which integrates [WIW authorized API](https://docs.wiw.io/build-with-wiw/authorized-api)
to retrieve WIW profile. Here are the steps to run the example:

1. Make sure you have maintenance LTS, active LTS, or current release of Node.js installed. For example, you can check the engine version with following command:
   ```
   $ node --version
   v16.14.2
   ```
2. Install necessary dependencies, then start the local server:
   ```
   $ npm install
   $ node main.js
   ```
3. Open a web explorer, enter [http://localhost:8888/login_wiw](http://localhost:8001/login_wiw), 
login with your WIW account and consent on prompt window. You will see the entire OAuth flow printed on your browser tab as well as in server logs.