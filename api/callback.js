const https = require('https');

module.exports = (req, res) => {
  const code = req.query.code;
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  const postData = JSON.stringify({
    client_id,
    client_secret,
    code
  });

  const options = {
    hostname: 'github.com',
    port: 443,
    path: '/login/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const request = https.request(options, (response) => {
    let body = '';
    response.on('data', (chunk) => body += chunk);
    response.on('end', () => {
      try {
        const data = JSON.parse(body);
        const token = data.access_token;
        const message = token 
          ? `authorization:github:success:${JSON.stringify({ token, provider: 'github' })}`
          : `authorization:github:error:${JSON.stringify(data)}`;

        const script = `
<!DOCTYPE html>
<html>
<body>
<script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage", e);
      window.opener.postMessage(
        '${message}',
        e.origin
      );
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(script);
      } catch (err) {
        res.status(500).send(err.message);
      }
    });
  });

  request.on('error', (err) => {
    res.status(500).send(err.message);
  });

  request.write(postData);
  request.end();
};
