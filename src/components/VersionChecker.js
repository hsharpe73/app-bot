import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const CURRENT_VERSION = '1.0.1';

const VersionChecker = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/version.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.version && data.version !== CURRENT_VERSION) {
          setOpen(true);
        }
      })
      .catch(err => {
        console.error('No se pudo verificar la versión', err);
      });
  }, []);

  const handleUpdate = () => {
    window.location.reload(true);
  };

  return (
    <Dialog open={open} onClose={handleUpdate}>
      <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#B57EDC', color: 'white' }}>
        🔄 Nueva actualización disponible
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mt: 1 }}>
          Se detectaron cambios en la aplicación. ¿Deseas actualizar para ver la última versión?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" onClick={handleUpdate} autoFocus>
          Actualizar ahora
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionChecker;
