import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, User, Briefcase, MapPin, Users, Camera, Video, Square, CreditCard, Upload, RotateCcw, Calculator, AlertTriangle, UserPlus } from 'lucide-react';
import { solicitudService } from '../../services/solicitudService';
import { clientService } from '../../services/clientService';
import { CURRENCY_CATALOG } from '../../data/currencies';
import { tenantService } from '../../services/tenantService';

const mode = new URLSearchParams(window.location.search).get('mode');
const isClientMode = mode === 'client';
const maxStep = isClientMode ? 5 : 6;

const steps = isClientMode
  ? [
      { id: 1, title: 'Datos Personales', icon: User },
      { id: 2, title: 'Información Laboral', icon: Briefcase },
      { id: 3, title: 'Ubicación', icon: MapPin },
      { id: 4, title: 'Referencias', icon: Users },
      { id: 5, title: 'Verificación', icon: Camera },
    ]
  : [
      { id: 1, title: 'Datos Personales', icon: User },
      { id: 2, title: 'Información Laboral', icon: Briefcase },
      { id: 3, title: 'Ubicación', icon: MapPin },
      { id: 4, title: 'Referencias', icon: Users },
      { id: 5, title: 'Verificación', icon: Camera },
      { id: 6, title: 'Préstamo', icon: Calculator },
    ];

function formatCurrency(value, currency = 'DOP') {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency }).format(value);
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
  const [enabledCurrencies, setEnabledCurrencies] = useState(['DOP']);
  useEffect(() => {
    if (!tenantId) return;
    tenantService.getCurrencies(tenantId).then((codes) => {
      const allowed = CURRENCY_CATALOG.filter((c) => codes.includes(c.code));
      if (allowed.length) { setEnabledCurrencies(allowed.map((c) => c.code)); setCalcCurrency((current) => allowed.some((c) => c.code === current) ? current : allowed[0].code); }
    }).catch(() => {});
  }, [tenantId]);
  const draftStorageKey = `prestamoplus-form:${isClientMode ? 'client' : 'request'}:${tenantId || 'default'}`;
  const readSavedDraft = useCallback(() => {
    try {
      return JSON.parse(sessionStorage.getItem(draftStorageKey) || 'null');
    } catch {
      return null;
    }
  }, [draftStorageKey]);
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = Number(readSavedDraft()?.step);
    return savedStep >= 1 && savedStep <= maxStep ? savedStep : 1;
  });
  const [submitted, setSubmitted] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoPoster, setVideoPoster] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const videoPreviewRef = useRef(null);
  const motionCanvasRef = useRef(null);
  const motionIntervalRef = useRef(null);
  const motionDataRef = useRef({ prevLeft: 0, prevRight: 0, movementCount: 0 });
  const recordingTimeRef = useRef(0);
  const recordingStartedAtRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const videoUrlRef = useRef(null);
  const idPhotoUrlRef = useRef(null);
  const idPhotoInputRef = useRef(null);
  const garantiaInputRef = useRef(null);
  const photoScrollPositionRef = useRef(0);

  const [videoValid, setVideoValid] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [movementProgress, setMovementProgress] = useState(0);

  const [idPhoto, setIdPhoto] = useState(null);
  const [idPhotoUrl, setIdPhotoUrl] = useState(null);
  const [idPhotoValid, setIdPhotoValid] = useState(false);
  const [idPhotoError, setIdPhotoError] = useState('');
  const [garantiaPhoto, setGarantiaPhoto] = useState(null);
  const [garantiaPhotoUrl, setGarantiaPhotoUrl] = useState(null);
  const [garantiaPhotoError, setGarantiaPhotoError] = useState('');

  const [calcAmount, setCalcAmount] = useState('');
  const [calcCurrency, setCalcCurrency] = useState('DOP');
  const [calcClosingCost, setCalcClosingCost] = useState('3');
  const [calcRate, setCalcRate] = useState('2.5');
  const [calcTerm, setCalcTerm] = useState('4');
  const [calcTermUnit, setCalcTermUnit] = useState('months');
  const [calcFrequency, setCalcFrequency] = useState('biweekly');
  const [calcResults, setCalcResults] = useState(null);

  const { register, handleSubmit, formState: { errors }, trigger, watch, reset } = useForm({
    defaultValues: {
      // Datos Personales
      nombre: '',
      cedula: '',
      email: '',
      telefono: '',
      fechaNacimiento: '',
      estadoCivil: '',
      // Información Laboral
      empresa: '',
      cargo: '',
      salario: '',
      antiguedad: '',
      direccionEmpresa: '',
      telefonoEmpresa: '',
      tipoEmpleo: '',
      // Ubicación
      direccion: '',
      ciudad: '',
      provincia: '',
      sector: '',
      codigoPostal: '',
      // Referencias
      ref1Nombre: '',
      ref1Relacion: '',
      ref1Telefono: '',
      ref1Email: '',
      ref2Nombre: '',
      ref2Relacion: '',
      ref2Telefono: '',
      ref2Email: '',
      // Datos Bancarios
      banco: '',
      tipoCuenta: '',
      numeroCuenta: '',
    }
  });

  useEffect(() => {
    const savedDraft = readSavedDraft();
    if (savedDraft?.values) reset(savedDraft.values);
  }, [readSavedDraft, reset]);

  useEffect(() => {
    const subscription = watch((values) => {
      sessionStorage.setItem(draftStorageKey, JSON.stringify({ step: currentStep, values }));
    });
    return () => subscription.unsubscribe();
  }, [currentStep, draftStorageKey, watch]);

  useEffect(() => {
    const savedDraft = readSavedDraft();
    sessionStorage.setItem(draftStorageKey, JSON.stringify({
      step: currentStep,
      values: savedDraft?.values || {},
    }));
  }, [currentStep, draftStorageKey, readSavedDraft]);

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
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      if (idPhotoUrlRef.current) URL.revokeObjectURL(idPhotoUrlRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      setVideoValid(false);
      setVideoError('');
      setMovementProgress(0);
      motionDataRef.current = { prevLeft: 0, prevRight: 0, movementCount: 0 };

      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setVideoError('Este navegador no permite grabar video. Abre el enlace en Chrome o Safari actualizado.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      chunksRef.current = [];
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      recordingStartedAtRef.current = performance.now();

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Setup motion detection canvas
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 160;
      motionCanvasRef.current = canvas;
      const ctx = canvas.getContext('2d');

      motionIntervalRef.current = setInterval(() => {
        if (!videoPreviewRef.current || !ctx) return;
        try {
          ctx.drawImage(videoPreviewRef.current, 0, 0, 120, 160);
          const imageData = ctx.getImageData(0, 40, 60, 80);
          const imageDataR = ctx.getImageData(60, 40, 60, 80);

          let sumL = 0, sumR = 0;
          for (let i = 0; i < imageData.data.length; i += 4) sumL += imageData.data[i];
          for (let i = 0; i < imageDataR.data.length; i += 4) sumR += imageDataR.data[i];
          const avgL = sumL / (imageData.data.length / 4);
          const avgR = sumR / (imageDataR.data.length / 4);

          const prev = motionDataRef.current;
          const diff = Math.abs(avgL - prev.prevLeft) + Math.abs(avgR - prev.prevRight);
          if (diff > 8) {
            prev.movementCount++;
            setMovementProgress(Math.min(100, prev.movementCount * 6));
          }
          prev.prevLeft = avgL;
          prev.prevRight = avgR;
        } catch { }
      }, 400);

      const supportedTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      const recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : {});
      const blobType = (recorder.mimeType || mimeType || 'video/webm').split(';')[0];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = (event) => {
        console.error('Error durante la grabacion:', event.error);
        setVideoError('La camara no pudo completar la grabacion. Intenta nuevamente.');
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: blobType });
        const elapsedSeconds = Math.max(
          recordingTimeRef.current,
          Math.floor((performance.now() - recordingStartedAtRef.current) / 1000)
        );
        setRecordingTime(elapsedSeconds);

        mediaStream.getTracks().forEach(t => t.stop());
        setStream(null);
        streamRef.current = null;
        setIsRecording(false);
        mediaRecorderRef.current = null;
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        if (motionIntervalRef.current) { clearInterval(motionIntervalRef.current); motionIntervalRef.current = null; }

        const moves = motionDataRef.current.movementCount;
        if (blob.size < 1024) {
          setVideoBlob(null);
          setVideoUrl(null);
          setVideoValid(false);
          setVideoError('No se pudo guardar el video. Verifica el permiso de la camara e intenta de nuevo.');
          return;
        }

        const recordedVideoUrl = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(recordedVideoUrl);
        videoUrlRef.current = recordedVideoUrl;

        if (moves >= 3 && elapsedSeconds >= 4) {
          setVideoValid(true);
          setVideoError('');
        } else if (elapsedSeconds < 4) {
          setVideoValid(false);
          setVideoError('Video muy corto. Graba al menos 4 segundos girando la cabeza.');
        } else {
          setVideoValid(false);
          setVideoError('No se detectó movimiento facial. Gira la cabeza de izquierda a derecha.');
        }
      };

      // Un solo archivo conserva la duracion y los metadatos de reproduccion.
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((performance.now() - recordingStartedAtRef.current) / 1000);
        recordingTimeRef.current = elapsedSeconds;
        setRecordingTime(elapsedSeconds);
      }, 250);
    } catch (err) {
      console.error('Error accediendo a la cámara:', err);
      alert('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      const preview = videoPreviewRef.current;
      if (preview?.videoWidth && preview?.videoHeight) {
        const posterCanvas = document.createElement('canvas');
        posterCanvas.width = preview.videoWidth;
        posterCanvas.height = preview.videoHeight;
        posterCanvas.getContext('2d')?.drawImage(preview, 0, 0);
        setVideoPoster(posterCanvas.toDataURL('image/jpeg', 0.82));
      }
      recorder.stop();
    }
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (motionIntervalRef.current) { clearInterval(motionIntervalRef.current); motionIntervalRef.current = null; }
  };

  const deleteVideo = () => {
    setVideoBlob(null);
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    setVideoUrl(null);
    setVideoPoster(null);
    videoUrlRef.current = null;
    setVideoValid(false);
    setVideoError('');
    setMovementProgress(0);
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    recordingStartedAtRef.current = 0;
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    if (stream) stream.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStream(null);
    if (timerRef.current) clearInterval(timerRef.current);
    if (motionIntervalRef.current) clearInterval(motionIntervalRef.current);
  };

  const handleIdPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (!file) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: photoScrollPositionRef.current, behavior: 'auto' });
    });
    if (!file.type.startsWith('image/')) {
      setIdPhotoError('Selecciona una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIdPhotoError('El archivo excede 5MB. Usa una imagen más pequeña.');
      return;
    }
    setIdPhoto(file);
    if (idPhotoUrlRef.current) URL.revokeObjectURL(idPhotoUrlRef.current);
    const photoUrl = URL.createObjectURL(file);
    setIdPhotoUrl(photoUrl);
    idPhotoUrlRef.current = photoUrl;
    setIdPhotoValid(true);
    setIdPhotoError('');

    // La validacion visual queda desactivada temporalmente; solo se exige el archivo.
    const shouldValidateIdentification = false;
    if (!shouldValidateIdentification) return;

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
    img.src = photoUrl;
  };

  const removeIdPhoto = () => {
    setIdPhoto(null);
    if (idPhotoUrlRef.current) URL.revokeObjectURL(idPhotoUrlRef.current);
    setIdPhotoUrl(null);
    idPhotoUrlRef.current = null;
    setIdPhotoValid(false);
    setIdPhotoError('');
    if (idPhotoInputRef.current) idPhotoInputRef.current.value = '';
  };

  const handleGarantiaPhoto = (e) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setGarantiaPhotoError('Selecciona una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setGarantiaPhotoError('El archivo excede 5MB. Usa una imagen más pequeña.');
      return;
    }
    if (garantiaPhotoUrl) URL.revokeObjectURL(garantiaPhotoUrl);
    setGarantiaPhoto(file);
    setGarantiaPhotoUrl(URL.createObjectURL(file));
    setGarantiaPhotoError('');
  };

  const removeGarantiaPhoto = () => {
    if (garantiaPhotoUrl) URL.revokeObjectURL(garantiaPhotoUrl);
    setGarantiaPhoto(null);
    setGarantiaPhotoUrl(null);
    setGarantiaPhotoError('');
    if (garantiaInputRef.current) garantiaInputRef.current.value = '';
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
        if (!isClientMode && !garantiaPhoto) {
          setGarantiaPhotoError('La foto de la garantía es obligatoria para una solicitud de oficina.');
          alert('Sube una foto clara de la garantía para continuar.');
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
      setCurrentStep(prev => Math.min(prev + 1, maxStep));
    }
  };

  const prevStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data) => {
    if (isClientMode && currentStep !== 5) return;
    if (!isClientMode && currentStep !== 6) return;
    try {
      let verificationMedia = null;
      if (videoBlob || idPhoto || garantiaPhoto) {
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
        if (garantiaPhoto) {
          const garantiaBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(garantiaPhoto);
          });
          verificationMedia.garantiaPath = garantiaBase64;
        }
      }

      const solicitud = isClientMode ? null : {
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
        moneda: calcCurrency,
        tasaInteresMensual: parseFloat(calcRate) || 2.5,
        plazo: parseInt(calcTerm) || 4,
        unidadPlazo: 0,
        frecuenciaPago: calcFrequency === 'daily' ? 0 : calcFrequency === 'weekly' ? 1 : calcFrequency === 'biweekly' ? 2 : 3,
        gastoCierrePorcentaje: parseFloat(calcClosingCost) || 3,
        tipoPrestamo: 1,
      };

      const clientPayload = {
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
        consentAccepted: Boolean(data.consentAccepted),
      };

      if (isClientMode) {
        await clientService.register(clientPayload);
      } else {
        await solicitudService.create(solicitud);
      }
      sessionStorage.removeItem(draftStorageKey);
      setSubmitted(true);
    } catch (err) {
      console.error('Error enviando solicitud:', err);
      const validationErrors = err.response?.data?.errors;
      const validationMessage = Array.isArray(validationErrors)
        ? validationErrors.map((item) => item.message).filter(Boolean).join('\n')
        : '';
      const message = validationMessage
        || err.response?.data?.message
        || (err.code === 'ECONNABORTED'
          ? 'El envío tardó demasiado. Verifica tu conexión e intenta nuevamente.'
          : 'No fue posible conectar con el servidor. Verifica tu conexión e intenta nuevamente.');
      alert(message);
    }
  };

  const formatAmountInput = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    if (num) return formatNumber(parseInt(num));
    return '';
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-canvas flex items-center justify-center p-4">
        <div className="bg-white rounded-16 shadow-card-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-success-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-navy-500 mb-2">
            {isClientMode ? '¡Registro Completado!' : '¡Solicitud Enviada!'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {isClientMode
              ? 'Tus datos han sido registrados. El asesor te atenderá para continuar con tu préstamo.'
              : 'Tu solicitud ha sido recibida. Nos pondremos en contacto en 24-48 horas.'}
          </p>
          {!isClientMode && (
            <p className="text-xs text-slate-300">
              Referencia: #SP-{Date.now().toString().slice(-6)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-accent-500">PréstamoPlus</h1>
          <p className="text-sm text-gray-500">Solicitud de Préstamo</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-accent-500' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > step.id ? 'bg-green-500 text-white' :
                    currentStep === step.id ? 'bg-accent-600 text-white' :
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
                  <input {...register('nombre', { required: 'El nombre es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Juan Pérez" />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cédula/RNC *</label>
                  <input {...register('cedula', { required: 'La cédula es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="001-1234567-8" />
                  {errors.cedula && <p className="text-red-500 text-sm mt-1">{errors.cedula.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input {...register('email', { required: 'El email es requerido', pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' } })} type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="tu@email.com" />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                  <input {...register('telefono', { required: 'El teléfono es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="809-555-0101" />
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de nacimiento *</label>
                  <input {...register('fechaNacimiento', { required: 'La fecha es requerida' })} type="date" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" />
                  {errors.fechaNacimiento && <p className="text-red-500 text-sm mt-1">{errors.fechaNacimiento.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado civil *</label>
                  <select {...register('estadoCivil', { required: 'El estado civil es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
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
                  <input {...register('empresa', { required: 'La empresa es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Nombre de la empresa" />
                  {errors.empresa && <p className="text-red-500 text-sm mt-1">{errors.empresa.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo *</label>
                  <input {...register('cargo', { required: 'El cargo es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Tu cargo actual" />
                  {errors.cargo && <p className="text-red-500 text-sm mt-1">{errors.cargo.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salario mensual *</label>
                  <input {...register('salario', { required: 'El salario es requerido' })} type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="15000" />
                  {errors.salario && <p className="text-red-500 text-sm mt-1">{errors.salario.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Antigüedad (años) *</label>
                  <input {...register('antiguedad', { required: 'La antigüedad es requerida' })} type="number" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="3" />
                  {errors.antiguedad && <p className="text-red-500 text-sm mt-1">{errors.antiguedad.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dirección de la empresa</label>
                  <input {...register('direccionEmpresa')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Dirección completa" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de la empresa</label>
                  <input {...register('telefonoEmpresa')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="809-555-0202" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de empleo *</label>
                  <select {...register('tipoEmpleo', { required: 'El tipo de empleo es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
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
                  <input {...register('direccion', { required: 'La dirección es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Calle, número, urbanización" />
                  {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad *</label>
                  <input {...register('ciudad', { required: 'La ciudad es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Santo Domingo" />
                  {errors.ciudad && <p className="text-red-500 text-sm mt-1">{errors.ciudad.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                  <select {...register('provincia', { required: 'La provincia es requerida' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
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
                  <input {...register('sector')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Zona colonial" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código Postal</label>
                  <input {...register('codigoPostal')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="10101" />
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
                    <input {...register('ref1Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Nombre de la referencia" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select {...register('ref1Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input {...register('ref1Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="809-555-0301" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input {...register('ref1Email')} type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="referencia@email.com" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Referencia 2</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo *</label>
                    <input {...register('ref2Nombre', { required: currentStep === 4 ? 'El nombre es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Nombre de la referencia" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relación *</label>
                    <select {...register('ref2Relacion', { required: currentStep === 4 ? 'La relación es requerida' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
                      <option value="">Seleccionar</option>
                      <option value="familiar">Familiar</option>
                      <option value="amigo">Amigo</option>
                      <option value="compañero">Compañero de trabajo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono *</label>
                    <input {...register('ref2Telefono', { required: currentStep === 4 ? 'El teléfono es requerido' : false })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="809-555-0302" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input {...register('ref2Email')} type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="referencia@email.com" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Verificación Facial + Foto ID + Datos Bancarios */}
          {currentStep === 5 && (
            <div className="space-y-8">
              {/* Video Facial */}
              <div className="bg-white rounded-16 border border-surface-border shadow-card p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="text-navy-500" size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-navy-500">Verificación Facial</h2>
                  <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                    Graba un video girando la cabeza. Detectamos el movimiento en tiempo real para asegurar que eres tú.
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  {/* Preview */}
                  <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[3/4] rounded-16 overflow-hidden bg-navy-500/5 border-2 border-surface-border shadow-card">
                    {!videoUrl ? (
                      <>
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        {!stream && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-3">
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center">
                              <Camera size={36} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-medium text-slate-400">Presiona "Iniciar" para comenzar</p>
                          </div>
                        )}
                        {isRecording && (
                          <>
                            {/* Face guide */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                              <div className="w-[70%] h-[50%] rounded-full border-2 border-white/30" />
                            </div>
                            {/* Recording HUD */}
                            <div className="absolute top-3 left-0 right-0 px-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                                  <span className="text-white text-xs font-mono font-bold">{formatTime(recordingTime)}</span>
                                </div>
                                <span className="text-white text-[10px] font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                                  {movementProgress < 20 ? 'Gira la cabeza' :
                                   movementProgress < 50 ? 'Sigue girando...' :
                                   movementProgress < 80 ? 'Casi listo' :
                                   'Completado'}
                                </span>
                              </div>
                              <div className="w-full bg-white/15 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, movementProgress)}%`,
                                    background: movementProgress >= 80
                                      ? 'linear-gradient(90deg, #059669, #10b981)'
                                      : 'linear-gradient(90deg, #006bff, #60a5fa)'
                                  }}
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <video src={videoUrl} poster={videoPoster || undefined} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Status */}
                  {(videoUrl || videoError) && (
                    <div className="mt-4">
                      {videoValid ? (
                        <div className="flex items-center gap-2 text-success-600 text-sm font-semibold bg-success-50 px-4 py-2 rounded-full">
                          <Check size={16} /> Video válido — {formatTime(recordingTime)} grabados
                        </div>
                      ) : videoError ? (
                        <div className="flex items-center gap-2 text-danger-500 text-sm bg-danger-50 px-4 py-2 rounded-full">
                          <AlertTriangle size={14} /> {videoError}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Steps */}
                  <div className="flex items-center gap-4 sm:gap-8 mt-6 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-navy-50 text-navy-500 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                      Buena iluminación
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-navy-50 text-navy-500 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                      Rostro en el círculo
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-navy-50 text-navy-500 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                      Gira la cabeza
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap justify-center gap-3 mt-6">
                    {!videoUrl && !isRecording && (
                      <button type="button" onClick={startRecording} className="flex items-center gap-2 px-6 py-3 gradient-accent text-white rounded-8 hover:opacity-90 transition-opacity font-semibold text-sm shadow-btn">
                        <Video size={18} />
                        Iniciar Grabación
                      </button>
                    )}
                    {isRecording && (
                      <button type="button" onClick={stopRecording} disabled={recordingTime < 4} className="flex items-center gap-2 px-6 py-3 bg-navy-500 text-white rounded-8 hover:bg-navy-600 transition-colors font-semibold text-sm shadow-btn disabled:cursor-not-allowed disabled:opacity-50">
                        <Square size={18} />
                        {recordingTime < 4 ? `Espera ${4 - recordingTime}s` : `Detener (${formatTime(recordingTime)})`}
                      </button>
                    )}
                    {videoUrl && (
                      <button type="button" onClick={deleteVideo} className="flex items-center gap-2 px-5 py-3 border-2 border-danger-200 text-danger-500 rounded-8 hover:bg-danger-50 transition-colors font-semibold text-sm">
                        <RotateCcw size={16} />
                        Grabar de nuevo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Foto de Identificación */}
              <div className="bg-white rounded-16 border border-surface-border shadow-card p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-warning-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Upload className="text-warning-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-500">Foto de Identificación *</h3>
                    <p className="text-slate-400 text-sm">Sube una foto clara de tu cédula o pasaporte</p>
                  </div>
                </div>

                {!idPhotoUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      photoScrollPositionRef.current = window.scrollY;
                      idPhotoInputRef.current?.click();
                    }}
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-surface-border rounded-12 cursor-pointer hover:border-accent-500 hover:bg-accent-50/30 transition-all group"
                  >
                    <Upload className="w-10 h-10 mb-3 text-slate-300 group-hover:text-accent-500 transition-colors" />
                    <p className="text-sm font-medium text-slate-400 group-hover:text-accent-500 transition-colors">Haz clic para subir</p>
                    <p className="text-xs text-slate-300 mt-1">PNG, JPG — Máx. 5MB</p>
                  </button>
                ) : (
                  <div className="relative">
                    <img src={idPhotoUrl} alt="Identificación" className="w-full h-48 object-contain bg-surface-canvas rounded-12 border border-surface-border" />
                    <button type="button" onClick={removeIdPhoto} className="absolute top-3 right-3 p-2 bg-danger-500 text-white rounded-full hover:bg-danger-600 transition-colors shadow-btn">
                      <Square size={14} />
                    </button>
                  </div>
                )}
                <input
                  ref={idPhotoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleIdPhoto}
                />
                {idPhotoUrl && idPhotoValid && (
                  <div className="flex items-center gap-2 text-success-600 text-sm font-semibold bg-success-50 px-4 py-2 rounded-full mt-3 w-fit">
                    <Check size={16} /> Identificación válida
                  </div>
                )}
                {idPhotoError && (
                  <div className="flex items-center gap-2 text-danger-500 text-sm bg-danger-50 px-4 py-2 rounded-full mt-3 w-fit">
                    <AlertTriangle size={14} /> {idPhotoError}
                  </div>
                )}
                {!idPhotoUrl && <p className="text-danger-500 text-xs mt-3 font-medium">* Requerido para continuar</p>}
              </div>

              {!isClientMode && (
                <div className="mt-6 rounded-16 border-2 border-accent-200 bg-accent-50/40 p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0"><Upload className="text-accent-600" size={24} /></div>
                    <div><h3 className="text-lg font-bold text-navy-500">Garantía del préstamo <span className="text-danger-500">*</span></h3><p className="text-slate-500 text-sm">Requerida para registrar solicitudes desde oficina.</p></div>
                  </div>
                  {!garantiaPhotoUrl ? (
                    <button type="button" onClick={() => garantiaInputRef.current?.click()} className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-accent-200 rounded-12 cursor-pointer bg-white hover:border-accent-500 hover:bg-accent-50 transition-all">
                      <Upload className="w-9 h-9 mb-2 text-accent-400" /><p className="text-sm font-semibold text-accent-600">Subir foto de garantía</p><p className="text-xs text-slate-400 mt-1">JPG, PNG o WEBP · Máx. 5MB</p>
                    </button>
                  ) : (
                    <div className="relative"><img src={garantiaPhotoUrl} alt="Garantía del préstamo" className="w-full h-48 object-contain bg-white rounded-12 border border-accent-200" /><button type="button" onClick={removeGarantiaPhoto} className="absolute top-3 right-3 p-2 bg-danger-500 text-white rounded-full hover:bg-danger-600"><Square size={14} /></button></div>
                  )}
                  <input ref={garantiaInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleGarantiaPhoto} />
                  {garantiaPhotoError && <p className="mt-3 text-sm font-semibold text-danger-500">{garantiaPhotoError}</p>}
                </div>
              )}

              {/* Datos Bancarios */}
              <div className="bg-white rounded-16 border border-surface-border shadow-card p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="text-navy-500" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-navy-500">Datos Bancarios *</h3>
                    <p className="text-slate-400 text-sm">Cuenta donde recibirás el desembolso</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institución Bancaria *</label>
                    <select {...register('banco', { required: 'El banco es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white">
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
                    <select {...register('tipoCuenta', { required: 'El tipo de cuenta es requerido' })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white">
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
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
                  <div className="mb-2 flex items-center justify-between"><label className="block text-sm font-medium text-gray-700">Monto *</label><select aria-label="Moneda de la solicitud" value={calcCurrency} onChange={e => setCalcCurrency(e.target.value)} className="max-w-[13rem] rounded-md border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm">{CURRENCY_CATALOG.filter(({ code }) => enabledCurrencies.includes(code)).map(({ code, flag, name }) => <option key={code} value={code}>{flag} {name} ({code})</option>)}</select></div>
                  <input
                    type="text"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(formatAmountInput(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg"
                    placeholder="2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plazo *</label>
                  <select
                    value={calcTerm}
                    onChange={(e) => setCalcTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    placeholder="3"
                  />
                </div>
              </div>

              {calcResults && calcResults.payment > 0 && (
                <div className="mt-8">
                  <div className="bg-gradient-to-r from-navy-500 to-navy-600 rounded-2xl p-6 sm:p-8 text-white text-center">
                    <p className="text-navy-200 mb-2 text-sm sm:text-base">Tu cuota {getFrequencyName(calcFrequency).toLowerCase()} sería</p>
                    <p className="text-3xl sm:text-4xl font-bold mb-4">{formatCurrency(calcResults.payment, calcCurrency)}</p>
                    <p className="text-navy-200 text-xs sm:text-sm">* Cálculo sujeto a aprobación de crédito</p>
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

          {currentStep === maxStep && isClientMode && (
            <label className="mt-6 flex items-start gap-3 text-sm text-gray-700">
              <input type="checkbox" {...register('consentAccepted', { required: 'Debes aceptar el consentimiento de datos' })} className="mt-1" />
              <span>Acepto el tratamiento de mis datos, la evaluación crediticia y las comunicaciones relacionadas con mi solicitud.</span>
            </label>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
              <button type="button" onClick={prevStep} className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <ChevronLeft size={20} />
                Anterior
              </button>
            ) : <div />}

            {currentStep < maxStep ? (
              <button type="button" onClick={(e) => nextStep(e)} className="flex items-center gap-2 px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors">
                Siguiente
                <ChevronRight size={20} />
              </button>
            ) : (
              <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <Check size={20} />
                {isClientMode ? 'Completar Registro' : 'Enviar Solicitud'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
