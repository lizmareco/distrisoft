'use client'

import { useRootContext } from '@/src/app/context/root';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apis } from '@/src/apis';
import jwt from 'jsonwebtoken';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment, TextField, Button, Checkbox, FormControlLabel } from '@mui/material';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setState } = useRootContext();
  const router = useRouter();

  useEffect(() => {
    if(accessToken) {
      const userData = jwt.decode(accessToken);
      setState.setSession(userData);
      router.push('/');
    }
  }, [accessToken]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(apis.login.url, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (response.status === 200) {
        const data = await response.json();
        setAccessToken(data.accessToken);
      }
    } catch (err) {
      setError('Correo o contraseña inválidos');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='w-full max-w-md mx-auto p-4 bg-white rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-8 text-center text-gray-800'>Log In</h2>
      
      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md'>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className='mb-3'>
          <TextField
            fullWidth
            label="Correo"
            id="correo"
            name="correo"
            type="email"
            autoComplete="email"
            required
            value={formData.correo}
            onChange={handleChange}
            InputProps={{ style: { color: 'black' } }}
          />
        </div>
        
        <div className='mb-3'>
          <TextField
            fullWidth
            label="Contraseña"
            id="contrasena"
            name="contrasena"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={formData.contrasena}
            onChange={handleChange}
            InputProps={{
              style: { color: 'black' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </div>
        
        <div className='flex items-center mb-6'>
          <FormControlLabel
            control={
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                color="primary"
              />
            }
            label="Recuérdame"
          />
        </div>
        
        <div>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </div>
      </form>
      
      <div className='mt-6 text-center'>
        <a href='#' className='text-sm text-gray-700 hover:text-gray-800'>
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </div>
  );
}
