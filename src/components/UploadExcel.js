import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Fade,
  Chip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const WEBHOOK_EXCEL_URL = 'https://app-bot.app.n8n.cloud/webhook/subir-excel';

const UploadExcel = ({ open, onClose }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor selecciona un archivo Excel.');
      setSnackbarOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(WEBHOOK_EXCEL_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(response.data?.mensaje || 'Archivo procesado correctamente.');
      setSelectedFile(null);
      onClose(); // Cierra el modal al subir exitosamente
    } catch (error) {
      setMessage('⚠️ Error al subir el archivo.');
    } finally {
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: 10,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 'bold',
            fontSize: '1.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 5,
          }}
        >
          📄 Subir Archivo Excel
          <Tooltip title="Cerrar">
            <IconButton
              aria-label="cerrar"
              onClick={onClose}
              sx={{ color: 'grey.500' }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
                  boxShadow: 2,
                }}
              >
                Seleccionar Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>

              {selectedFile ? (
                <Chip
                  label={selectedFile.name}
                  color="primary"
                  variant="outlined"
                  sx={{ maxWidth: 200 }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Ningún archivo seleccionado
                </Typography>
              )}
            </Stack>

            <Typography variant="caption" color="text.secondary">
              ✅ Solo se permiten archivos .xlsx o .xls
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            color="success"
            disabled={!selectedFile}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: 2,
              boxShadow: !selectedFile ? 'none' : 4,
              opacity: !selectedFile ? 0.5 : 1,
              transition: 'all 0.3s ease',
            }}
          >
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UploadExcel;
