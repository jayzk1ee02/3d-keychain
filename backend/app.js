const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();

// Middleware to parse JSON data
app.use(cors());
app.use(bodyParser.json());

// Serve the `generated_files` folder as static files
app.use('/generated_files', express.static(path.join(__dirname, 'generated_files')));

// API to generate the STL
app.post('/generate-stl', (req, res) => {
    console.log(req.body);
    const { plateNum, plateCode, template } = req.body;
   
    const upperCasePlateCode = plateCode.toUpperCase();
    // Validate that the text contains only numbers (for plate number)
    const plateNumber = /^[0-9]+$/;
    if (!plateNumber.test(plateNum)) {
        return res.status(400).send('Invalid plate number. Only numbers are allowed.');
    }
    
    console.log('Received request to /generate-stl:', req.body);

    let plateCodeSize = 12;
    let plateNumSize = 12;
    
    // Default text position values
    let x_pCode = 0;
    let y_pCode = 0;

    let x_pNum = 0;
    let y_pNum = 0;

    let z_pCodeNum = 2.95;
    
    // Default SCAD file path
    let baseScadFile = '';
    
    // Define template configuration for all templates in a structured way
    const templateConfig = {
        'dubai_new': {
            scadFile: 'dubai_new.scad',
            x_pCode: 15,
            y_pCode: 10,

            x_pNum: 46.5,
            y_pNum: 10,

            plateCodeSize: plateCode.length > 1 ? 7 : 12, // Conditional for plateCode size
            adjustPlateCodePosition_x: plateCode.length > 1 ? 16 : 15,
            adjustPlateCodePosition_y: plateCode.length > 1 ? 10 : 10,

        },
        'dubai_old': {
            scadFile: 'dubai_old.scad',
            x_pCode: 16.5,
            y_pCode: 5.40,
            x_pNum: 45.5,
            y_pNum: 10,
            plateCodeSize: plateCode.length > 1 ? 9 : 12, // Conditional for plateCode size
            adjustPlateCodePosition_x: plateCode.length > 1 ? 18.5 : 16.5,
            adjustPlateCodePosition_y: plateCode.length > 1 ? 10 : 10,
        },

        'dubai_new_sm': {
            scadFile: 'dubai_new_sm.scad',
            x_pCode: 28.5,
            y_pCode: 5.40,
            x_pNum: 44,
            y_pNum: 10,
            plateCodeSize: plateCode.length > 1 ? 5.20 : 5.20, // Conditional for plateCode size
            adjustPlateCodePosition_x: plateCode.length > 1 ? 29.8 : 28.5,
            adjustPlateCodePosition_y: plateCode.length > 1 ? 5.40 : 5.40,
        },

        'sharjah_old': {
            scadFile: 'sharjah_old.scad',
            x_pCode: 15,
            y_pCode: 10,
            x_pNum: 46.5,
            y_pNum: 10,
            plateCodeSize: 10,  // You can add additional logic here if needed for Sharjah
            adjustPlateCodePosition_x: 15,
            adjustPlateCodePosition_y: 10,
        }
    };
    
    // Use switch to select the correct template
    switch (template) {
        case 'dubai_new':
        case 'dubai_new_sm':
        case 'dubai_old':
        case 'sharjah_old':
       {
            const config = templateConfig[template];
    
            baseScadFile = path.join(__dirname, 'scripts', config.scadFile);
            x_pCode = config.adjustPlateCodePosition_x;
            y_pCode = config.adjustPlateCodePosition_y;

            x_pNum = config.x_pNum;
            y_pNum = config.y_pNum;

            plateCodeSize = config.plateCodeSize;
            
            break;
        }
    
        default:
            return res.status(400).send('Invalid template selected');
    }

    // Generate the dynamic file name based on plateCode and plateNum
    const outputFileName = `${upperCasePlateCode}-${plateNum}.stl`;
    const outputFilePath = path.join(__dirname, 'generated_files', outputFileName);  // Save to `generated_files` folder

    // Read the base SCAD template file
    fs.readFile(baseScadFile, 'utf8', (err, scadTemplate) => {
        if (err) {
            console.error('Error reading SCAD template file:', err);
            return res.status(500).send('Error reading SCAD template');
        }


        // Replace placeholders with dynamic values
        const scadScript = scadTemplate
            .replace('<plateNum>', plateNum)
            .replace('<plateCode>', upperCasePlateCode)

            .replace('<plateCodeSize>', plateCodeSize)
            .replace('<plateNumSize>', plateNumSize)

            .replace('<x_pCode>', x_pCode)
            .replace('<y_pCode>', y_pCode)

            .replace('<x_pNum>', x_pNum)
            .replace('<y_pNum>', y_pNum)
            .replace('<z_pCodeNum>', z_pCodeNum)

        // Create the path for the SCAD file
        const scadFile = path.join(__dirname, 'scripts', 'temp.scad');

        // Try writing the SCAD file
        try {
            fs.writeFileSync(scadFile, scadScript);
        } catch (err) {
            console.error('Error writing SCAD file:', err);
            
            return res.status(500).send('Error writing SCAD file');
        }

        // Log the OpenSCAD command
        const openScadCommand = `openscad -o "${outputFilePath}" "${scadFile}"`;
        // Run OpenSCAD to generate STL
        exec(openScadCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send('Error generating STL');
            }
            if (stderr) {
                console.error('OpenSCAD STDERR:', stderr);
            }
            console.log('OpenSCAD STDOUT:', stdout);

            // Send the file path for download
            res.send({ message: 'STL generated successfully', file: `/generated_files/${outputFileName}` });
        });
    });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
