'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeIcon, EyeOffIcon } from 'lucide-react'; // Asegúrate de tener lucide-react instalado

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Estado para las validaciones
  const [validations, setValidations] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });

  // Validar la contraseña cuando cambia
  useEffect(() => {
    setValidations({
      length: nuevaContrasena.length >= 8,
      uppercase: /[A-Z]/.test(nuevaContrasena),
      lowercase: /[a-z]/.test(nuevaContrasena),
      number: /[0-9]/.test(nuevaContrasena),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaContrasena),
      match: nuevaContrasena === confirmarContrasena && nuevaContrasena !== ''
    });
  }, [nuevaContrasena, confirmarContrasena]);

  // Verificar si todas las validaciones pasan
  const isPasswordValid = Object.values(validations).every(v => v === true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token no válido. Por favor solicita un nuevo enlace de recuperación.');
      return;
    }
    
    if (!isPasswordValid) {
      setError('Por favor cumple con todos los requisitos de la contraseña.');
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          nuevaContrasena
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña');
      }
      
      setMessage('Contraseña cambiada exitosamente. Redirigiendo al inicio de sesión...');
      
      // Redireccionar al login después de 3 segundos
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para alternar la visibilidad de la contraseña
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Función para alternar la visibilidad de la confirmación de contraseña
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Cambiar Contraseña</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="nuevaContrasena" className="block text-sm font-medium text-gray-700 mb-1">
            Nueva Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="nuevaContrasena"
              value={nuevaContrasena}
              onChange={(e) => setNuevaContrasena(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
            <button 
              type="button" 
              className="absolute inset-y-0 right-0 pr-3 flex items-center" 
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <label htmlFor="confirmarContrasena" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmarContrasena"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
            <button 
              type="button" 
              className="absolute inset-y-0 right-0 pr-3 flex items-center" 
              onClick={toggleConfirmPasswordVisibility}
            >
              {showConfirmPassword ? (
                <EyeOffIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
        
        {/* Requisitos de contraseña */}
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">La contraseña debe tener:</h3>
          <ul className="space-y-1 text-sm">
            <li className={`flex items-center ${validations.length ? 'text-green-600' : 'text-gray-500'}`}>
              <span className="mr-2">{validations.length ? '✓' : '○'}</span>
              Al menos 8 caracteres
            </li>
            <li className={`flex items-center ${validations.uppercase ? 'text-green-600' : 'text-gray-500'}`}>
              <span className="mr-2">{validations.uppercase ? '✓' : '○'}</span>
              Al menos una letra mayúscula
            </li>
            <li className={`flex items-center ${validations.lowercase ? 'text-green-600' : 'text-gray-500'}`}>
              <span className="mr-2">{validations.lowercase ? '✓' : '○'}</span>
              Al menos una letra minúscula
            </li>
            <li className={`flex items-center ${validations.number ? 'text-green-600' : 'text-gray-500'}`}>
              <span className="mr-2">{validations.number ? '✓' : '○'}</span>
              Al menos un número
            </li>
            <li className={`flex items-center ${validations.special ? 'text-green-600' : 'text-gray-500'}`}>
              <span className="mr-2">{validations.special ? '✓' : '○'}</span>
              Al menos un carácter especial (!@#$%^&*...)
            </li>
            <li className={`flex items-center ${validations.match ? 'text-green-600' : 'text-gray-500'}`}>
              <span className="mr-2">{validations.match ? '✓' : '○'}</span>
              Las contraseñas coinciden
            </li>
          </ul>
        </div>
        
        <button
          type="submit"
          disabled={loading || !isPasswordValid}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isPasswordValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          } transition-colors`}
        >
          {loading ? 'Cambiando contraseña...' : 'Cambiar Contraseña'}
        </button>
      </form>
    </div>
  );
}