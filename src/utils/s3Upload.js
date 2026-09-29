import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Obtener credenciales desde las variables de entorno de Vite
const getS3Config = () => {
  const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  const bucketName = import.meta.env.VITE_AWS_BUCKET_NAME || 'destino-salento-bucket';
  const customDomain = import.meta.env.VITE_AWS_S3_CUSTOM_DOMAIN;

  const isConfigured = Boolean(accessKeyId && secretAccessKey && bucketName);

  return {
    region,
    accessKeyId,
    secretAccessKey,
    bucketName,
    customDomain,
    isConfigured
  };
};

export const checkS3Configured = () => {
  return getS3Config().isConfigured;
};

export const getS3ConfigStatus = () => {
  const config = getS3Config();
  return {
    isConfigured: config.isConfigured,
    bucketName: config.bucketName || 'destino-salento-bucket',
    region: config.region,
    hasAccessKey: Boolean(config.accessKeyId),
    hasSecretKey: Boolean(config.secretAccessKey)
  };
};

/**
 * Convierte un archivo de JavaScript (File) a Uint8Array para el SDK de AWS
 */
const fileToBuffer = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

/**
 * Determina automáticamente la carpeta de destino en el bucket S3 según el tipo de archivo:
 * - images/ (para imágenes JPG, PNG, WEBP, SVG, etc.)
 * - documents/ (para PDF, DOCX, TXT, JSON, etc.)
 * - videos/ (para MP4, MOV, WEBM, etc.)
 */
const detectBucketFolder = (file, explicitFolder) => {
  if (explicitFolder) return explicitFolder;

  const mime = file.type || '';

  if (mime.startsWith('image/')) {
    return 'images';
  } else if (mime.startsWith('video/')) {
    return 'videos';
  } else {
    return 'documents';
  }
};

/**
 * Crea un cliente S3 con las credenciales de la config actual
 */
const createClient = (config) => {
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
};

/**
 * Construye la URL pública de un objeto del bucket, respetando el dominio personalizado
 */
export const buildS3PublicUrl = (fileKey, config = getS3Config()) => {
  if (config.customDomain) {
    const baseUrl = config.customDomain.endsWith('/')
      ? config.customDomain.slice(0, -1)
      : config.customDomain;
    return `${baseUrl}/${fileKey}`;
  }
  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;
};

/**
 * Extrae la clave (Key) de un objeto a partir de su URL pública.
 * Devuelve null si la URL no pertenece a este bucket (por ejemplo, una imagen externa)
 */
const extractS3KeyFromUrl = (url, config) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

  const bucketBases = [
    `https://${config.bucketName}.s3.${config.region}.amazonaws.com`,
    `https://s3.${config.region}.amazonaws.com/${config.bucketName}`,
    `https://${config.bucketName}.s3.amazonaws.com`
  ];

  if (config.customDomain) {
    bucketBases.unshift(config.customDomain.endsWith('/') ? config.customDomain.slice(0, -1) : config.customDomain);
  }

  for (const base of bucketBases) {
    if (url.startsWith(`${base}/`)) {
      return decodeURIComponent(url.slice(base.length + 1));
    }
  }

  return null;
};

/**
 * Sube un archivo a AWS S3 respetando las carpetas del bucket (images, documents, videos)
 * @param {File} file Archivo a subir
 * @param {string} customFolder Carpeta personalizada opcional (ej: 'images', 'documents', 'videos')
 */
export const uploadFileToS3 = async (file, customFolder = null) => {
  const config = getS3Config();

  if (!config.isConfigured) {
    throw new Error(
      'Configuración de S3 incompleta en .env. Verifica VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY y VITE_AWS_BUCKET_NAME.'
    );
  }

  // Detectar carpeta adecuada (images, documents, videos)
  const targetFolder = detectBucketFolder(file, customFolder);

  // Generar un nombre único y limpio
  const timestamp = Date.now();
  const cleanFileName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
  const fileKey = `${targetFolder}/${timestamp}-${cleanFileName}`;

  const client = createClient(config);

  const fileBytes = await fileToBuffer(file);

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: fileKey,
    Body: fileBytes,
    ContentType: file.type || 'image/jpeg'
  });

  try {
    await client.send(command);

    return buildS3PublicUrl(fileKey, config);
  } catch (error) {
    console.error('Error detallado al subir archivo a AWS S3:', error);
    
    // Captura específica del NetworkError que ocurre cuando CORS no está activado en la consola de AWS S3
    if (
      error.name === 'TypeError' || 
      (error.message && error.message.toLowerCase().includes('networkerror')) ||
      (error.message && error.message.toLowerCase().includes('failed to fetch'))
    ) {
      throw new Error(
        `Falta activar CORS en tu Bucket de AWS S3 ('${config.bucketName}'). El navegador bloquea la petición directa desde localhost. Habilita la política CORS en la pestaña Permisos de tu Bucket en la consola de AWS.`
      );
    }
    
    if (error.name === 'AccessDenied' || error.name === 'InvalidAccessKeyId') {
      throw new Error('Credenciales de AWS inválidas o sin permisos de escritura. Verifica tu ACCESS_KEY_ID y SECRET_ACCESS_KEY en .env');
    }
    
    throw new Error(`Error al subir a S3 (${targetFolder}/): ${error.message}`);
  }
};

/**
 * Elimina un objeto del bucket de S3 a partir de su URL pública.
 * Solo borra archivos que pertenezcan a este bucket: si la URL es externa
 * (ej. Unsplash) o una vista previa local en base64, no hace nada.
 * @param {string} url URL pública del archivo a eliminar
 * @returns {Promise<boolean>} true si el objeto fue eliminado
 */
export const deleteFileFromS3 = async (url) => {
  const config = getS3Config();

  if (!config.isConfigured) {
    throw new Error(
      'Configuración de S3 incompleta en .env. Verifica VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY y VITE_AWS_BUCKET_NAME.'
    );
  }

  const fileKey = extractS3KeyFromUrl(url, config);

  // No es un archivo de este bucket: nada que borrar
  if (!fileKey) return false;

  const client = createClient(config);

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: fileKey
    }));

    console.log(`Archivo eliminado de S3: ${fileKey}`);
    return true;
  } catch (error) {
    console.error('Error detallado al eliminar archivo de AWS S3:', error);

    if (error.name === 'AccessDenied' || error.name === 'InvalidAccessKeyId') {
      throw new Error('Credenciales de AWS inválidas o sin permisos de eliminación. Verifica tu ACCESS_KEY_ID y SECRET_ACCESS_KEY en .env');
    }

    throw new Error(`Error al eliminar de S3 (${fileKey}): ${error.message}`);
  }
};
