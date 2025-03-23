'use client'

import { useRootContext } from '@/src/app/context/root';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apis } from '@/src/apis';
import jwt from 'jsonwebtoken';


export default function LoginForm() {
  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessToken, setAccessToken] = useState(null);
  const { setState } = useRootContext();
  const router = useRouter();

  useEffect(() => {
    if(accessToken) {
      const userData = jwt.decode(accessToken);
      setState.setSession(userData);
      router.push(pages.home.route);
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
      setError('Invalid correo or contrasena');
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
          <label htmlFor='correo' className='block mb-2 text-sm font-medium text-gray-700'>
            Correo
          </label>
          <input
            id='correo'
            name='correo'
            type='correo'
            autoComplete='correo'
            required
            value={formData.correo}
            onChange={handleChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Ingrese su correo'
          />
        </div>
        
        <div className='mb-3'>
          <label htmlFor='contrasena' className='block mb-2 text-sm font-medium text-gray-700'>
            Contraseña
          </label>
          <input
            id='contrasena'
            name='contrasena'
            type='contrasena'
            autoComplete='current-contrasena'
            required
            value={formData.contrasena}
            onChange={handleChange}
            className='w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter your contrasena'
          />
        </div>
        
        <div className='flex items-center mb-6'>
          <input
            id='rememberMe'
            name='rememberMe'
            type='checkbox'
            checked={formData.rememberMe}
            onChange={handleChange}
            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
          />
          <label htmlFor='rememberMe' className='ml-2 block text-sm text-gray-700'>
            Remember me
          </label>
        </div>
        
        <div>
          <button
            type='submit'
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </div>
      </form>
      
      <div className='mt-6 text-center'>
        <a href='#' className='text-sm text-gray-700 hover:text-gray-800'>
          Olvidaste tú contraseña?
        </a>
      </div>
    </div>
  );
}