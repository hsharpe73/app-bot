import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';

const VersionChecker = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleNewVersion = () => {
      setOpen(true);
    };

    window.addEventListener('new-version-available', handleNewVersion);

    return () => {
      window.removeEventListener('new-version-available', handleNewVersion);
    };
  }, []);

  const handleUpdate = () => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
        window.location.reload(true);
      });
    } else {
      window.location.reload(true);
    }
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
