import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, User, Briefcase, MapPin, Users, Camera, Video, Square, CreditCard, Upload, RotateCcw, Calculator, AlertTriangle } from 'lucide-react';
import { solicitudService } from '../../services/solicitudService';

const steps = [
  { id: 1, title: 'Datos Personales', icon: User },
  { id: 2, title: 'Información Laboral', icon: Briefcase },
  { id: 3, title: 'Ubicación', icon: MapPin },
  { id: 4, title: 'Referencias', icon: Users },
  { id: 5, title: 'Verificación', icon: Video },
  { id: 6, title: 'Préstamo', icon: Calculator },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-DO').format(Math.round(value));
}

function getFrequencyName(frequency) {
  const names = { daily: 'Diaria', weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
  return names[frequency] || frequency;
}

function calculateLoanPayment(amount, closingCostPercent, monthlyRate, term, termUnit, frequency) {
  const closingCostAmount = amount * (closingCostPercent / 100);
  const principal = amount + closingCostAmount;

  // Tasa mensual directa
  const monthlyRateDecimal = (parseFloat(monthlyRate) || 2.5) / 100;
  
  // Calcular tasa por período según frecuencia de pago
  let periodRate;
  let periods;
  
  switch (frequency) {
    case 'daily':
      periodRate = monthlyRateDecimal / 30;
      periods = termUnit === 'years' ? term * 360 : term * 30;
      break;
    case 'weekly':
      periodRate = monthlyRateDecimal / 4;
      periods = termUnit === 'years' ? term * 48 : term * 4;
      break;
    case 'biweekly':
      periodRate = monthlyRateDecimal / 2;
      periods = termUnit === 'years' ? term * 24 : term * 2;
      break;
    case 'monthly':
    default:
      periodRate = monthlyRateDecimal;
      periods = termUnit === 'years' ? term * 12 : term;
      break;
  }

  if (periods <= 0 || principal <= 0) return { payment: 0, totalPaid: 0, totalInterest: 0, periods: 0 };

  if (periodRate <= 0) {
    const payment = principal / periods;
    return { payment: Math.round(payment * 100) / 100, totalPaid: principal, totalInterest: 0, periods: Math.round(periods) };
  }

  const factor = Math.pow(1 + periodRate, periods);
  const payment = principal * (periodRate * factor) / (factor - 1);
  const totalPaid = payment * periods;
  const totalInterest = totalPaid - principal;

  return {
    payment: Math.round(payment * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    periods: Math.round(periods),
    closingCostAmount: Math.round(closingCostAmount * 100) / 100,
  };
}

export default function Solicitud() {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant');
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoPreviewRef = useRef(null);
  const motionCanvasRef = useRef(null);
  const motionIntervalRef = useRef(null);
  const motionDataRef = useRef({ prevLeft: 0, prevRight: 0, movementCount: 0 });
  const recordingTimeRef = useRef(0);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [videoValid, setVideoValid] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [movementProgress, setMovementProgress] = useState(0);

  const [idPhoto, setIdPhoto] = useState(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState(null);
  const [idPhotoValid, setIdPhotoValid] = useState(false);
  const [idPhotoError, setIdPhotoError] = useState('');

  const [calcAmount, setCalcAmount] = useState('');
  const [calcClosingCost, setCalcClosingCost] = useState('3');
  const [calcRate, setCalcRate] = useState('2.5');
  const [calcTerm, setCalcTerm] = useState('4');
  const [calcTermUnit, setCalcTermUnit] = useState('months');
  const [calcFrequency, setCalcFrequency] = useState('biweekly');
  const [calcResults, setCalcResults] = useState(null);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm({
    defaultValues: {
      // Datos Personales
      nombre: 'Juan Carlos Pérez García',
      cedula: '001-1234567-8',
      email: 'juan.perez@email.com',
      telefono: '809-555-1234',
      fechaNacimiento: '1990-05-15',
      estadoCivil: 'casado',
      // Información Laboral
      empresa: 'Tecnologías del Caribe S.R.L.',
      cargo: 'Desarrollador Senior',
      salario: '85000',
      antiguedad: '5',
      direccionEmpresa: 'Av. Abraham Lincoln #45, Torre Empresarial, Piso 8',
      telefonoEmpresa: '809-555-5678',
      tipoEmpleo: 'formal',
      // Ubicación
      direccion: 'Calle Las Flores #23, Apt. 5B, Residencial El Jardín',
      ciudad: 'Santo Domingo',
      provincia: 'DN',
      sector: 'Piantini',
      codigoPostal: '10101',
      // Referencias
      ref1Nombre: 'María Elena Rodríguez',
      ref1Relacion: 'familiar',
      ref1Telefono: '809-555-9012',
      ref1Email: 'maria.rodriguez@email.com',
      ref2Nombre: 'Pedro Antonio Sánchez',
      ref2Relacion: 'compañero',
      ref2Telefono: '809-555-3456',
      ref2Email: 'pedro.sanchez@email.com',
      // Datos Bancarios
      banco: 'banco_popular',
      tipoCuenta: 'ahorro',
      numeroCuenta: '1234567890123456',
    }
  });

  const doCalc = useCallback(() => {
    const amount = parseFloat(calcAmount.replace(/,/g, '')) || 0;
    const term = parseInt(calcTerm) || 0;

    if (amount <= 0 || term <= 0) {
      setCalcResults(null);
      return;
    }

    const results = calculateLoanPayment(amount, calcClosingCost, calcRate, term, calcTermUnit, calcFrequency);
    setCalcResults(results);
  }, [calcAmount, calcClosingCost, calcRate, calcTerm, calcTermUnit, calcFrequency]);

  useEffect(() => {
    const timeout = setTimeout(doCalc, 300);
    return () => clearTimeout(timeout);
  }, [doCalc]);

  // Auto-fill calculadora para testing
  useEffect(() => {
    setCalcAmount('50,000');
  }, []);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (idPhotoUrl) URL.revokeObjectURL(idPhotoUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stream, videoUrl, idPhotoUrl]);

  const startRecording = async () => {
    try {
      setVideoValid(false);
      setVideoError('');
      setMovementProgress(0);
      motionDataRef.current = { prevLeft: 0, prevRight: 0, movementCount: 0 };

      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true });
      setStream(mediaStream);
      chunksRef.current = [];
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }

      // Setup motion detection canvas
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;
      motionCanvasRef.current = canvas;
      const ctx = canvas.getContext('2d');

      motionIntervalRef.current = setInterval(() => {
        if (!videoPreviewRef.current) return;
        try {
          ctx.drawImage(videoPreviewRef.current, 0, 0, 120, 160);
          const imageData = ctx.getImageData(0, 40, 60, 80);   // left half of face
          const imageDataR = ctx.getImageData(60, 40, 60, 80); // right half of face

          let sumL = 0, sumR = 0;
          for (let i = 0; i < imageData.data.length; i += 4) sumL += imageData.data[i];
          for (let i = 0; i < imageDataR.data.length; i += 4) sumR += imageDataR.data[i];
          const avgL = sumL / (imageData.data.length / 4);
          const avgR = sumR / (imageDataR.data.length / 4);

          const prev = motionDataRef.current;
          const diff = Math.abs(avgL - prev.prevLeft) + Math.abs(avgR - prev.prevRight);
          if (diff > 12) {
            prev.movementCount++;
            setMovementProgress(Math.min(100, prev.movementCount * 5));
          }
          prev.prevLeft = avgL;
          prev.prevRight = avgR;
        } catch { /* canvas may fail if video not ready */ }
      }, 400);

      const recorder = new MediaRecorder(mediaStream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        mediaStream.getTracks().forEach(t => t.stop());
        setStream(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
        if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);

        // Validate recording
        if (motionDataRef.current.movementCount >= 4 && recordingTimeRef.current >= 4) {
          setVideoValid(true);
          setVideoError('');
        } else if (recordingTimeRef.current < 4) {
          setVideoError('Video muy corto. Graba al menos 5 segundos girando la cabeza.');
        } else {
          setVideoError('No se detectó movimiento facial. Gira la cabeza de izquierda a derecha.');
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        recordingTimeRef.current++;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
  };

  const deleteVideo = () => {
    setVideoBlob(null);
    setVideoUrl(null);
    setVideoValid(false);
    setVideoError('');
    setMovementProgress(0);
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
  };

  const handleIdPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setIdPhotoError('El archivo excede 5MB. Usa una imagen más pequeña.');
      return;
    }
    setIdPhoto(file);
    setIdPhotoUrl(URL.createObjectURL(file));
    setIdPhotoValid(false);
    setIdPhotoError('');

    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      if (img.width < 300 || img.height < 400) {
        setIdPhotoError('La imagen es muy pequeña. Debe ser al menos 300x400 píxeles.');
        return;
      }
      if (ratio < 1.3) {
        setIdPhotoError('La imagen no tiene formato de documento. Una cédula o pasaporte es más alto que ancho.');
        return;
      }
      if (ratio > 2.2) {
        setIdPhotoError('La imagen es demasiado alargada. No parece una cédula o pasaporte.');
        return;
      }

      // Analyze image on canvas to detect document-like features
      const canvas = document.createElement('canvas');
      const maxDim = 400;
      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Check for text-like features: sample 16 regions and measure local variance
      let textRegions = 0;
      const regionSize = Math.floor(Math.min(w, h) / 8);
      for (let ry = 0; ry < 4; ry++) {
        for (let rx = 0; rx < 4; rx++) {
          const sx = Math.floor(rx * w / 4);
          const sy = Math.floor(ry * h / 4);
          let sum = 0, sumSq = 0, count = 0;
          for (let y = sy; y < Math.min(sy + regionSize, h); y += 2) {
            for (let x = sx; x < Math.min(sx + regionSize, w); x += 2) {
              const idx = (y * w + x) * 4;
              const gray = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
              sum += gray;
              sumSq += gray * gray;
              count++;
            }
          }
          if (count > 0) {
            const mean = sum / count;
            const variance = sumSq / count - mean * mean;
            if (variance > 800) textRegions++; // High variance = text/edges present
          }
        }
      }

      // 2. Edge density: count pixels with high gradient
      let edgePixels = 0;
      let totalSampled = 0;
      for (let y = 2; y < h - 2; y += 3) {
        for (let x = 2; x < w - 2; x += 3) {
          const idx = (y * w + x) * 4;
          const idxR = (y * w + (x + 1)) * 4;
          const idxD = ((y + 1) * w + x) * 4;
          const g = pixels[idx] * 0.299 + pixels[idx + 1] * 0.587 + pixels[idx + 2] * 0.114;
          const gr = pixels[idxR] * 0.299 + pixels[idxR + 1] * 0.587 + pixels[idxR + 2] * 0.114;
          const gd = pixels[idxD] * 0.299 + pixels[idxD + 1] * 0.587 + pixels[idxD + 2] * 0.114;
          if (Math.abs(g - gr) > 25 || Math.abs(g - gd) > 25) edgePixels++;
          totalSampled++;
        }
      }
      const edgeRatio = totalSampled > 0 ? edgePixels / totalSampled : 0;

      // 3. Skin tone check: count skin-colored pixels (face=selfie, not ID)
      let skinPixels = 0;
      let totalPixels = 0;
      for (let i = 0; i < pixels.length; i += 12) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        // Simple skin detection: R > G > B and within ranges
        if (r > 95 && g > 40 && b > 20 && r > g && g > b && (r - g) > 15 && (r - b) > 30) {
          skinPixels++;
        }
        totalPixels++;
      }
      const skinRatio = totalPixels > 0 ? skinPixels / totalPixels : 0;

      // Evaluate results
      const failures = [];
      if (textRegions < 3) {
        failures.push('no se detecta texto o estructura de documento');
      }
      if (edgeRatio < 0.08) {
        failures.push('la imagen es muy plana, sin bordes de texto o líneas');
      }
      if (skinRatio > 0.35) {
        failures.push('la imagen parece una selfie, no una cédula o pasaporte');
      }

      if (failures.length === 0) {
        setIdPhotoValid(true);
        setIdPhotoError('');
      } else {
        setIdPhotoError(`No parece una identificación: ${failures.join('; ')}.`);
        setIdPhotoValid(false);
      }
    };
    img.onerror = () => {
      setIdPhotoError('No se pudo leer la imagen. Intenta con otro archivo.');
    };
    img.src = URL.createObjectURL(file);
  };

  const removeIdPhoto = () => {
    setIdPhoto(null);
    if (idPhotoUrl) URL.revokeObjectURL(idPhotoUrl);
    setIdPhotoUrl(null);
    setIdPhotoValid(false);
    setIdPhotoError('');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validateStep = async () => {
    let fieldsToValidate = [];
    switch (currentStep) {
      case 1:
        fieldsToValidate = ['nombre', 'cedula', 'email', 'telefono', 'fechaNacimiento', 'estadoCivil'];
        break;
      case 2:
        fieldsToValidate = ['empresa', 'cargo', 'salario', 'antiguedad', 'tipoEmpleo'];
        break;
      case 3:
        fieldsToValidate = ['direccion', 'ciudad', 'provincia'];
        break;
      case 4:
        fieldsToValidate = ['ref1Nombre', 'ref1Relacion', 'ref1Telefono', 'ref2Nombre', 'ref2Relacion', 'ref2Telefono'];
        break;
      case 5:
        fieldsToValidate = ['banco', 'tipoCuenta', 'numeroCuenta'];
        const valid5 = await trigger(fieldsToValidate);
        if (!valid5) return false;
        if (!videoBlob) {
          alert('El video de verificación facial es requerido.');
          return false;
        }
        if (!videoValid) {
          alert(videoError || 'El video no pasó la verificación. Graba de nuevo girando la cabeza.');
          return false;
        }
        if (!idPhoto) {
          alert('La foto de identificación es requerida.');
          return false;
        }
        if (!idPhotoValid) {
          alert(idPhotoError || 'La foto no parece una identificación válida.');
          return false;
        }
        return true;
      default:
        return true;
    }
    const valid = await trigger(fieldsToValidate);
    return valid;
  };

  const nextStep = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isValid = await validateStep();
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    if (currentStep !== 6) return;
    try {
      let verificationMedia = null;
      if (videoBlob || idPhoto) {
        verificationMedia = {};
        if (videoBlob) {
          const videoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(videoBlob);
          });
          verificationMedia.videoPath = videoBase64;
        }
        if (idPhoto) {
          const fotoBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(idPhoto);
          });
          verificationMedia.fotoCedulaPath = fotoBase64;
        }
      }

      const solicitud = {
        tenantId: tenantId || null,
        client: {
          nombre: data.nombre,
          cedula: data.cedula,
          email: data.email,
          telefono: data.telefono,
          fechaNacimiento: data.fechaNacimiento,
          estadoCivil: data.estadoCivil === 'casado' ? 1 : data.estadoCivil === 'divorciado' ? 2 : data.estadoCivil === 'viudo' ? 3 : 0,
        },
        workInformation: {
          empresa: data.empresa,
          cargo: data.cargo,
          salario: parseFloat(data.salario) || 0,
          antiguedadAnios: parseInt(data.antiguedad) || 0,
          direccionEmpresa: data.direccionEmpresa,
          telefonoEmpresa: data.telefonoEmpresa,
          tipoEmpleo: data.tipoEmpleo === 'formal' ? 0 : data.tipoEmpleo === 'informal' ? 1 : data.tipoEmpleo === 'independiente' ? 2 : 3,
        },
        address: {
          direccion: data.direccion,
          ciudad: data.ciudad,
          provincia: data.provincia,
          sector: data.sector,
          codigoPostal: data.codigoPostal,
        },
        references: [
          { nombre: data.ref1Nombre, relacion: data.ref1Relacion === 'familiar' ? 0 : data.ref1Relacion === 'amigo' ? 1 : data.ref1Relacion === 'compañero' ? 2 : 3, telefono: data.ref1Telefono, email: data.ref1Email },
          { nombre: data.ref2Nombre, relacion: data.ref2Relacion === 'familiar' ? 0 : data.ref2Relacion === 'amigo' ? 1 : data.ref2Relacion === 'compañero' ? 2 : 3, telefono: data.ref2Telefono, email: data.ref2Email },
        ],
        bankAccount: {
          banco: data.banco,
          tipoCuenta: data.tipoCuenta === 'corriente' ? 0 : data.tipoCuenta === 'ahorro' ? 1 : 2,
          numeroCuenta: data.numeroCuenta,
        },
        verificationMedia,
        montoSolicitado: parseFloat(calcAmount.replace(/,/g, '')) || 0,
        tasaInteresMensual: parseFloat(calcRate) || 2.5,
        plazo: parseInt(calcTerm) || 4,
        unidadPlazo: 0,
        frecuenciaPago: calcFrequency === 'daily' ? 0 : calcFrequency === 'weekly' ? 1 : calcFrequency === 'biweekly' ? 2 : 3,
        gastoCierrePorcentaje: parseFloat(calcClosingCost) || 3,
        tipoPrestamo: 0,
      };
      await solicitudService.create(solicitud);
      setSubmitted(true);
    } catch (err) {
      console.error('Error enviando solicitud:', err);
      alert('Error al enviar la solicitud. Intenta de nuevo.');
    }
  };

  const formatAmountInput = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    if (num) return formatNumber(parseInt(num));
    return '';
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud Enviada!</h2>
          <p className="text-gray-500 mb-6">
            Tu solicitud ha sido recibida exitosamente. Nos pondremos en contacto contigo por correo electrónico en un plazo de 24-48 horas.
          </p>
          <p className="text-sm text-gray-400">
            Referencia: #SP-{Date.now().toString().slice(-6)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-primary-600">PréstamoPlus</h1>
          <p className="text-sm text-gray-500">Solicitud de Préstamo</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    currentStep === step.id ? 'bg-primary-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
                  </div>
                  <span className="hidden md:block font-medium text-sm">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 mx-1 ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {/* Step 1: Datos Personales */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Datos Personales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                  <input {...register('nombre', { required: 'El nombre es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Juan Pérez" />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula/RNC *</label>
                  <input {...register('cedula', { required: 'La cédula es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="001-1234567-8" />
                  {errors.cedula && <p className="text-red-500 text-sm mt-1">{errors.cedula.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input {...register('email', { required: 'El email es requerido', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })} type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="tu@email.com" />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input {...register('telefono', { required: 'El teléfono es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="809-555-0101" />
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de nacimiento *</label>
                  <input {...register('fechaNacimiento', { required: 'La fecha es requerida' })} type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
                  {errors.fechaNacimiento && <p className="text-red-500 text-sm mt-1">{errors.fechaNacimiento.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado civil *</label>
                  <select {...register('estadoCivil', { required: 'El estado civil es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Seleccionar</option>
                    <option value="soltero">Soltero/a</option>
                    <option value="casado">Casado/a</option>
                    <option value="divorciado">Divorciado/a</option>
                    <option value="viudo">Viudo/a</option>
                  </select>
                  {errors.estadoCivil && <p className="text-red-500 text-sm mt-1">{errors.estadoCivil.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Información Laboral */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Laboral</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Empresa *</label>
                  <input {...register('empresa', { required: 'La empresa es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Nombre de la empresa" />
                  {errors.empresa && <p className="text-red-500 text-sm mt-1">{errors.empresa.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo *</label>
                  <input {...register('cargo', { required: 'El cargo es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Tu cargo actual" />
                  {errors.cargo && <p className="text-red-500 text-sm mt-1">{errors.cargo.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salario mensual *</label>
                  <input {...register('salario', { required: 'El salario es requerido' })} type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="15000" />
                  {errors.salario && <p className="text-red-500 text-sm mt-1">{errors.salario.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Antigüedad (años) *</label>
                  <input {...register('antiguedad', { required: 'La antigüedad es requerida' })} type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="3" />
                  {errors.antiguedad && <p className="text-red-500 text-sm mt-1">{errors.antiguedad.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de la empresa</label>
                  <input {...register('direccionEmpresa')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Dirección completa" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de la empresa</label>
                  <input {...register('telefonoEmpresa')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="809-555-0202" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de empleo *</label>
                  <select {...register('tipoEmpleo', { required: 'El tipo de empleo es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Seleccionar</option>
                    <option value="formal">Formal (con contrato)</option>
                    <option value="informal">Informal</option>
                    <option value="independiente">Independiente</option>
                    <option value="jubilado">Jubilado</option>
                  </select>
                  {errors.tipoEmpleo && <p className="text-red-500 text-sm mt-1">{errors.tipoEmpleo.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Ubicación */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ubicación</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección completa *</label>
                  <input {...register('direccion', { required: 'La dirección es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Calle, número, urbanización" />
                  {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                  <input {...register('ciudad', { required: 'La ciudad es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Santo Domingo" />
                  {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                  <select {...register('provincia', { required: 'La provincia es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                    <option value="">Seleccionar</option>
                    <option value="DN">Distrito Nacional</option>
                    <option value="SD">Santo Domingo</option>
                    <option value="SC">Santiago</option>
                    <option value="PR">Puerto Plata</option>
                    <option value="LA">La Altagracia</option>
                  </select>
                  {errors.provincia && <p className="text-red-500 text-sm mt-1">{errors.provincia.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sector</label>
                  <input {...register('sector')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Zona colonial" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                  <input {...register('codigoPostal')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="10101" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Referencias */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Referencias Personales</h2>
              <p className="text-gray-500 mb-6">Proporciona al menos dos referencias que puedan confirmar tu identidad.</p>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Referencia 1</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input {...register('ref1Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Nombre de la referencia" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select {...register('ref1Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input {...register('ref1Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="809-555-0301" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input {...register('ref1Email')} type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="referencia@email.com" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Referencia 2</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input {...register('ref2Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Nombre de la referencia" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select {...register('ref2Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input {...register('ref2Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="809-555-0302" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input {...register('ref2Email')} type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="referencia@email.com" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Verificación Facial + Foto ID + Datos Bancarios */}
          {currentStep === 5 && (
            <div className="space-y-8">
              {/* Video Facial Ovalado */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificación Facial</h2>
                <p className="text-gray-500 mb-4">
                  Graba un video de tu rostro girando la cabeza de izquierda a derecha.
                  El sistema detectará el movimiento para confirmar que eres una persona real.
                </p>

                <div className="flex flex-col items-center">
                  {/* Marco ovalado para el video */}
                  <div className="relative w-56 h-72 sm:w-72 sm:h-96 rounded-[50%] overflow-hidden bg-gray-900 border-4 border-primary-500 shadow-lg">
                    {!videoUrl ? (
                      <>
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        {!stream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                            <div className="text-center px-4">
                              <Camera className="mx-auto text-primary-400 mb-3" size={40} />
                              <p className="text-gray-300 text-xs sm:text-sm">Haz clic en "Iniciar" para comenzar</p>
                            </div>
                          </div>
                        )}
                        {isRecording && (
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3/4">
                            <div className="flex items-center gap-2 bg-red-600/90 px-3 py-1.5 rounded-full mb-2">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                              <span className="text-white text-xs font-medium">{formatTime(recordingTime)}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${movementProgress}%`,
                                  backgroundColor: movementProgress >= 80 ? '#22c55e' : '#3b82f6'
                                }}
                              />
                            </div>
                            <p className="text-white text-xs mt-1 text-center drop-shadow">
                              {movementProgress < 20 ? 'Gira la cabeza...' :
                               movementProgress < 50 ? 'Bien, sigue girando...' :
                               movementProgress < 80 ? '¡Casi listo!' :
                               '¡Movimiento detectado!'}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <video src={videoUrl} controls className="w-full h-full object-cover" />
                    )}

                    {/* Guía ovalada */}
                    {!videoUrl && (
                      <div className="absolute inset-0 pointer-events-none">
                        <svg viewBox="0 0 288 384" className="w-full h-full">
                          <ellipse cx="144" cy="160" rx="90" ry="110" fill="none" stroke="rgba(59,130,246,0.5)" strokeWidth="2" strokeDasharray="8 4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Estado de validación */}
                  {videoUrl && (
                    <div className="mt-3">
                      {videoValid ? (
                        <p className="text-green-600 text-sm font-medium flex items-center gap-1">
                          <Check size={16} /> Video válido — rostro verificado
                        </p>
                      ) : videoError ? (
                        <p className="text-red-500 text-sm">{videoError}</p>
                      ) : null}
                    </div>
                  )}

                  {/* Instrucciones */}
                  <div className="mt-4 text-center max-w-xs sm:max-w-sm">
                    <p className="text-sm text-gray-600 font-medium">Instrucciones:</p>
                    <ul className="text-xs text-gray-500 mt-1 space-y-1">
                      <li>• Mantén tu rostro dentro del óvalo</li>
                      {isRecording && <li className="text-primary-600 font-medium">• Gira suavemente la cabeza de izquierda a derecha</li>}
                      <li>• Asegúrate de tener buena iluminación</li>
                      <li>• El video debe durar al menos 5 segundos con movimiento</li>
                    </ul>
                  </div>

                  {/* Botones */}
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {!videoUrl && !isRecording && (
                      <button type="button" onClick={startRecording} className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <Video size={20} />
                        Iniciar Grabación
                      </button>
                    )}
                    {isRecording && (
                      <button type="button" onClick={stopRecording} className="flex items-center gap-2 px-4 sm:px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                        <Square size={20} />
                        Detener ({formatTime(recordingTime)})
                      </button>
                    )}
                    {videoUrl && (
                      <button type="button" onClick={deleteVideo} className="flex items-center gap-2 px-4 sm:px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <RotateCcw size={18} />
                        Grabar de nuevo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Foto de Identificación */}
              <div className="p-4 sm:p-6 bg-amber-50 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <Upload className="text-amber-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Foto de Identificación *</h3>
                    <p className="text-sm text-gray-500">Sube una foto de tu cédula o pasaporte (obligatorio)</p>
                  </div>
                </div>

                {!idPhotoUrl ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed border-amber-300 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 sm:w-10 sm:h-10 mb-3 text-amber-400" />
                      <p className="mb-2 text-sm text-gray-600"><span className="font-semibold">Haz clic para subir</span></p>
                      <p className="text-xs text-gray-500">PNG, JPG o PDF (MAX. 5MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleIdPhoto} />
                  </label>
                ) : (
                  <div className="relative">
                    <img src={idPhotoUrl} alt="Identificación" className="w-full h-32 sm:h-48 object-contain bg-white rounded-xl border border-gray-200" />
                    <button type="button" onClick={removeIdPhoto} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700">
                      <Square size={14} />
                    </button>
                  </div>
                )}
                {idPhotoUrl && idPhotoValid && (
                  <p className="text-green-600 text-sm font-medium mt-2 flex items-center gap-1">
                    <Check size={16} /> Identificación válida
                  </p>
                )}
                {idPhotoError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertTriangle size={14} /> {idPhotoError}
                  </p>
                )}
                {!idPhotoUrl && <p className="text-red-500 text-sm mt-2">* La foto de identificación es requerida</p>}
              </div>

              {/* Datos Bancarios */}
              <div className="p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <CreditCard className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Datos Bancarios</h3>
                    <p className="text-sm text-gray-500">Ingresa los datos de la cuenta donde recibirás el dinero</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institución Bancaria *</label>
                    <select {...register('banco', { required: 'El banco es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                      <option value="">Seleccionar banco</option>
                      <option value="banco_reservas">Banco de Reservas</option>
                      <option value="banco_popular">Banco Popular</option>
                      <option value="banco_bhd">Banco BHD</option>
                      <option value="banco_santa_cruz">Banco Santa Cruz</option>
                      <option value="banco_caribe">Banco Caribe</option>
                      <option value="banco_vimenca">Banco Vimenca</option>
                      <option value="banco_promerica">Banco Promerica</option>
                      <option value="banco_novel">Banco Novel</option>
                      <option value="banco_muxi">Banco MUXI</option>
                      <option value="banco_optimo">Banco Óptimo</option>
                      <option value="asociacion_la_efectiva">Asociación La Efectiva</option>
                      <option value="otro">Otro</option>
                    </select>
                    {errors.banco && <p className="text-red-500 text-sm mt-1">{errors.banco.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Cuenta *</label>
                    <select {...register('tipoCuenta', { required: 'El tipo de cuenta es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                      <option value="">Seleccionar tipo</option>
                      <option value="corriente">Corriente</option>
                      <option value="ahorro">Ahorro</option>
                      <option value="nomina">Nómina</option>
                    </select>
                    {errors.tipoCuenta && <p className="text-red-500 text-sm mt-1">{errors.tipoCuenta.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Cuenta *</label>
                    <input
                      {...register('numeroCuenta', { required: 'El número de cuenta es requerido' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="0000000000"
                    />
                    {errors.numeroCuenta && <p className="text-red-500 text-sm mt-1">{errors.numeroCuenta.message}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Calculadora de Préstamo */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Calcula tu Préstamo</h2>
              <p className="text-gray-500 mb-6">Ingresa el monto y el interés mensual que deseas.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monto (RD$) *</label>
                  <input
                    type="text"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(formatAmountInput(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                    placeholder="50,000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interés mensual (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plazo *</label>
                  <select
                    value={calcTerm}
                    onChange={(e) => setCalcTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  >
                    <option value="1">1 mes</option>
                    <option value="2">2 meses</option>
                    <option value="3">3 meses</option>
                    <option value="4">4 meses</option>
                    <option value="6">6 meses</option>
                    <option value="12">12 meses</option>
                    <option value="24">24 meses</option>
                    <option value="36">36 meses</option>
                    <option value="48">48 meses</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de pago</label>
                  <select
                    value={calcFrequency}
                    onChange={(e) => setCalcFrequency(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="daily">Diaria</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gasto de cierre (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={calcClosingCost}
                    onChange={(e) => setCalcClosingCost(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="3"
                  />
                </div>
              </div>

              {calcResults && calcResults.payment > 0 && (
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white text-center">
                    <p className="text-primary-100 mb-2 text-sm sm:text-base">Tu cuota {getFrequencyName(calcFrequency).toLowerCase()} sería</p>
                    <p className="text-3xl sm:text-4xl font-bold mb-4">{formatCurrency(calcResults.payment)}</p>
                    <p className="text-primary-200 text-xs sm:text-sm">* Cálculo sujeto a aprobación de crédito</p>
                  </div>

                  <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <Check className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">¿Por qué PréstamoPlus?</p>
                        <ul className="text-sm text-green-700 mt-1 space-y-1">
                          <li>• Aprobación rápida en menos de 24 horas</li>
                          <li>• Sin penalización por pago anticipado</li>
                          <li>• Cuotas fijas durante todo el plazo</li>
                          <li>• Dinero directo a tu cuenta bancaria</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <input type="hidden" {...register('montoSolicitado')} value={calcAmount.replace(/,/g, '')} />
              <input type="hidden" {...register('plazoMeses')} value={calcTerm} />
              <input type="hidden" {...register('tipoPrestamo')} value="personal" />
              <input type="hidden" {...register('cuotaEstimada')} value={calcResults?.payment || ''} />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft size={20} />
                Anterior
              </button>
            ) : <div />}

            {currentStep < 6 ? (
              <button type="button" onClick={(e) => nextStep(e)} className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                Siguiente
                <ChevronRight size={20} />
              </button>
            ) : (
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Check size={20} />
                Enviar Solicitud
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
