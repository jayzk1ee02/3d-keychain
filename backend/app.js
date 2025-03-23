const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();

// Load SSL Certificates
const sslOptions = {
  key: fs.readFileSync('/ssl/server.key'),
  cert: fs.readFileSync('/ssl/server.cert')
};

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/generated_files', express.static(path.join(__dirname, 'generated_files')));

// API to generate the STL
app.post('/generate-stl', (req, res) => {
  console.log(req.body);
  const { plateNum, plateCode, template } = req.body;
  const upperCasePlateCode = plateCode.toUpperCase();

  const plateNumber = /^[0-9]+$/;
  if (!plateNumber.test(plateNum)) {
    return res.status(400).send('Invalid plate number. Only numbers are allowed.');
  }

  const templateConfig = {
    'dubai_new': {
      scadFile: 'dubai_new.scad',
      x_pCode: 15, y_pCode: 10, x_pNum: 46.5, y_pNum: 10,
      plateCodeSize: plateCode.length > 1 ? 7 : 12,
    },
    'dubai_old': {
      scadFile: 'dubai_old.scad',
      x_pCode: 16.5, y_pCode: 5.4, x_pNum: 45.5, y_pNum: 10,
      plateCodeSize: plateCode.length > 1 ? 9 : 12,
    },
    'dubai_new_sm': {
      scadFile: 'dubai_new_sm.scad',
      x_pCode: 28.5, y_pCode: 5.4, x_pNum: 44, y_pNum: 10,
      plateCodeSize: 5.2,
    },
    'sharjah_old': {
      scadFile: 'sharjah_old.scad',
      x_pCode: 15, y_pCode: 10, x_pNum: 46.5, y_pNum: 10,
      plateCodeSize: 10,
    }
  };

  if (!templateConfig[template]) {
    return res.status(400).send('Invalid template selected');
  }

  const { scadFile, x_pCode, y_pCode, x_pNum, y_pNum, plateCodeSize } = templateConfig[template];
  const outputFileName = `${upperCasePlateCode}-${plateNum}.stl`;
  const outputFilePath = path.join(__dirname, 'generated_files', outputFileName);

  const scadTemplatePath = path.join(__dirname, 'scripts', scadFile);
  fs.readFile(scadTemplatePath, 'utf8', (err, scadTemplate) => {
    if (err) return res.status(500).send('Error reading SCAD template');

    const scadScript = scadTemplate
      .replace('<plateNum>', plateNum)
      .replace('<plateCode>', upperCasePlateCode)
      .replace('<plateCodeSize>', plateCodeSize)
      .replace('<x_pCode>', x_pCode)
      .replace('<y_pCode>', y_pCode)
      .replace('<x_pNum>', x_pNum)
      .replace('<y_pNum>', y_pNum);

    const tempScadFile = path.join(__dirname, 'scripts', 'temp.scad');
    fs.writeFileSync(tempScadFile, scadScript);

    const openScadCommand = `openscad -o "${outputFilePath}" "${tempScadFile}"`;
    exec(openScadCommand, (error) => {
      if (error) return res.status(500).send('Error generating STL');
      res.send({ message: 'STL generated successfully', filename: outputFileName });
    });
  });
});

// Route to download the generated STL
app.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, 'generated_files', filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Start HTTPS server
const PORT = process.env.PORT || 3001;
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Backend running on https://localhost:${PORT}`);
});
