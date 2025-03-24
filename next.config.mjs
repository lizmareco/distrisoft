/** @type {import('next').NextConfig} */
const nextConfig = {
    // Otras configuraciones...
    
    // Asegúrate de que las variables de entorno estén disponibles con los nombres correctos
    env: {
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_REFRESH_TOKEN: process.env.JWT_REFRESH_TOKEN,
    },
  };
  
  export default nextConfig;
  
  
