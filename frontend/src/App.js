import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, MenuItem, Select, FormControl, InputLabel, CircularProgress, Box, Fade, Container } from '@mui/material';
import './styles.css';  // Import the styles for custom CSS

function App() {
  const [formData, setFormData] = useState({
    plateNum: '',
    plateCode: '',
    template: 'dubai_new', // Default to "Dubai Plate - New"
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadLink, setDownloadLink] = useState('');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    setDownloadLink(''); // Clear previous download link
  
    try {
      const response = await axios.post('http://192.168.70.148:3001/generate-stl', formData);
      console.log('Backend response:', response);
  
      if (response.data.filename) {
        setMessage('Your STL file is ready!');
        setDownloadLink(`http://192.168.70.148:3001/download/${response.data.filename}`);
      }
    } catch (error) {
      console.error('Error generating STL:', error);
      setMessage('Error generating STL. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',  // Full viewport height
        backgroundColor: '#f4f4f9',
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            border: '1px solid #ccc',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            backgroundColor: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Add company logo here */}
          <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: 0 }}>
            <img
              src="/articraftiq-logo.png" // Replace with your actual logo image
              alt="Articraftiq"
              style={{ width: '250px' }}
            />
          </Box>

          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Generate 3D Plate Number</h2>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* Conditional Plate Code Field */}
            <Box sx={{ marginBottom: 2 }}>
              <TextField
                label="Plate Code"
                name="plateCode"
                value={formData.plateCode}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                required
                inputProps={{
                  maxLength: formData.template === 'sharjah_old' ? 1 : 2, // Conditional maxLength
                  pattern: formData.template === 'sharjah_old' ? '[0-9]{1}' : '[A-Za-z]{1,2}', // Conditional pattern
                }}
              />
            </Box>

            <Box sx={{ marginBottom: 2 }}>
              <TextField
                label="Plate Number"
                name="plateNum"
                value={formData.plateNum}
                onChange={handleInputChange}
                fullWidth
                variant="outlined"
                required
                inputProps={{
                  pattern: '[0-9]{1,5}',
                  maxLength: 5,
                }}
              />
            </Box>

            <Box sx={{ marginBottom: 2 }}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Choose Template</InputLabel>
                <Select
                  name="template"
                  value={formData.template}
                  onChange={handleInputChange}
                  label="Choose Template"
                >
                  <MenuItem value="dubai_new">Dubai Plate - New</MenuItem>
                  <MenuItem value="dubai_new_sm">Dubai Plate - New Small</MenuItem>
                  <MenuItem value="dubai_old">Dubai Plate - Old</MenuItem>
                  <MenuItem value="sharjah_old">Sharjah Plate - Old</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
              sx={{ marginTop: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate STL'}
            </Button>
          </form>

          <Fade in={!!message} timeout={1000}>
            <Box sx={{ marginTop: 2, textAlign: 'center' }}>
              {message && <h3>{message}</h3>}

              {downloadLink && (
  <Button
    variant="contained"
    color="secondary"
    href={downloadLink}
    download
    sx={{ marginTop: 2 }}
  >
    Download STL
  </Button>
)}

            </Box>
          </Fade>
        </Box>
      </Container>
    </Box>
  );
}

export default App;
