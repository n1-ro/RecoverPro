import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Mic, Play, Pause, AlertCircle, ArrowRight, ArrowLeft, CheckCircle, Clock, Loader2, Send, MessageSquare, Upload, XCircle, UserRound, Radio } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ProgressBar } from './ProgressBar';

interface Scenario {
  id: number;
  title: string;
  description: string;
  response_type: 'audio' | 'text';
  display_order: number;
}

export function Dashboard() {
  const { user, loading } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [textResponse, setTextResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    country: '',
    referredBy: '' // New field for who referred you
  });
  // For position type selection
  const [positionType, setPositionType] = useState<'voice' | 'non-voice' | null>(null);
  
  // For elapsed time display
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Question timer state
  const [questionTimer, setQuestionTimer] = useState(0);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  
  // Audio visualization
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchScenarios();
      fetchUserProgress();
    }
    
    return () => {
      // Clean up audio recording resources
      if (recorder) {
        try {
          recorder.stream?.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Error stopping recorder stream:', error);
        }
      }
      
      // Clean up audio context
      if (audioContext.current) {
        try {
          audioContext.current.close();
        } catch (error) {
          console.error('Error closing audio context:', error);
        }
      }
      
      // Cancel animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      // Clear timer if it exists
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Clear question timer
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [user]);

  // Start question timer when a new question is shown
  useEffect(() => {
    if (interviewStarted && scenarios.length > 0) {
      // Reset and start the question timer
      startQuestionTimer();
    }
    
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [interviewStarted, currentScenarioIndex, scenarios.length]);

  // Timer effect for recording duration
  useEffect(() => {
    if (isRecording) {
      // Reset timer
      setElapsedTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // Clear timer when not recording
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  // Start the question timer
  const startQuestionTimer = () => {
    // Clear any existing timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }
    
    const currentScenarioId = scenarios[currentScenarioIndex]?.id;
    const isCompleted = completedSteps.includes(currentScenarioId);
    
    // Only start the timer if this question hasn't been completed yet
    if (!isCompleted) {
      setQuestionStartTime(Date.now());
      setQuestionTimer(0);
      
      questionTimerRef.current = setInterval(() => {
        setQuestionTimer(prev => prev + 1);
      }, 1000);
    } else {
      // For completed questions, don't run the timer
      setQuestionTimer(0);
    }
  };

  // Stop the question timer
  const stopQuestionTimer = () => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  };

  const fetchUserProgress = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfileInfo(profile);
      
      if (profile.current_scenario_index !== null && profile.current_scenario_index !== undefined) {
        setCurrentScenarioIndex(profile.current_scenario_index);
      }
      
      if (profile.interview_started_at) {
        setInterviewStarted(true);
      }
      
      if (profile.completed_at) {
        setShowCompletionForm(true);
        setFormData({
          fullName: profile.full_name || '',
          phoneNumber: profile.phone_number || '',
          country: profile.address || '', // Repurpose address field for country
          referredBy: profile.desired_salary || '' // Repurpose desired_salary field for referral
        });
      }
      
      // Check for completed steps
      const { data: recordings, error: recordingsError } = await supabase
        .from('recordings')
        .select('scenario_id')
        .eq('user_id', user.id);
        
      if (recordingsError) throw recordingsError;
      
      const { data: textResponses, error: textResponsesError } = await supabase
        .from('text_responses')
        .select('scenario_id')
        .eq('user_id', user.id);
        
      if (textResponsesError) throw textResponsesError;
      
      // Find all scenarios that already have responses
      const audioResponseScenarioIds = recordings?.map(r => r.scenario_id) || [];
      const textResponseScenarioIds = textResponses?.map(r => r.scenario_id) || [];
      const respondedScenarioIds = [...new Set([...audioResponseScenarioIds, ...textResponseScenarioIds])];
      
      setCompletedSteps(respondedScenarioIds);
      
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchScenarios = async () => {
    try {
      setScenariosLoading(true);
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setScenarios(data);
      }
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setErrorMessage('Failed to load interview questions. Please try again later.');
      setShowError(true);
    } finally {
      setScenariosLoading(false);
    }
  };

  const startInterview = async () => {
    if (!user || !positionType) return;
    
    try {
      // Update profile to mark interview as started and store position type in employment_status field
      const { error } = await supabase
        .from('profiles')
        .update({ 
          interview_started_at: new Date().toISOString(),
          current_scenario_index: 0,
          employment_status: positionType // Store position type in employment_status field
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setInterviewStarted(true);
      setCurrentScenarioIndex(0);
      // Start the question timer for the first question
      startQuestionTimer();
    } catch (error) {
      console.error('Error starting interview:', error);
      setErrorMessage('Failed to start the interview. Please try again.');
      setShowError(true);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      // Create audio context for visualization
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContext.current.createAnalyser();
      mediaStreamSource.current = audioContext.current.createMediaStreamSource(stream);
      mediaStreamSource.current.connect(analyserRef.current);
      
      // Configure analyser
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Start visualization
      visualizeAudio();
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener('stop', () => {
        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);
          setAudioChunks(chunks);
          
          // Stop visualization
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
          }
        } catch (error) {
          console.error('Error processing audio after recording:', error);
          setErrorMessage('Error processing the recording. Please try again.');
          setShowError(true);
        }
      });
      
      setRecorder(mediaRecorder);
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setResponseTime(null);
      setAudioURL(null);
      
    } catch (error) {
      console.error('Error setting up recording:', error);
      setErrorMessage('Unable to access your microphone. Please check your browser permissions and try again.');
      setShowError(true);
    }
  };

  const stopAudioRecording = () => {
    try {
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (stopError) {
          console.error('Error stopping recorder:', stopError);
          // Continue with cleanup even if stop fails
        }
        
        // Calculate response time regardless of stop success
        if (recordingStartTime) {
          setResponseTime(Math.round((Date.now() - recordingStartTime) / 1000));
        }
        
        // Stop all tracks with error handling
        try {
          if (recorder.stream) {
            recorder.stream.getTracks().forEach(track => {
              try {
                track.stop();
              } catch (trackError) {
                console.error('Error stopping track:', trackError);
              }
            });
          }
        } catch (streamError) {
          console.error('Error accessing recorder stream:', streamError);
        }
      }
      
      // Clean up audio context resources
      try {
        if (mediaStreamSource.current) {
          mediaStreamSource.current.disconnect();
        }
      } catch (audioContextError) {
        console.error('Error disconnecting media stream source:', audioContextError);
      }
      
      // Cancel visualization animation frame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Always update recording state regardless of errors
      setIsRecording(false);
      
    } catch (error) {
      console.error('Error in stopAudioRecording:', error);
      // Ensure we still update the UI state even if errors occur
      setIsRecording(false);
      setErrorMessage('An error occurred while stopping the recording. Your progress is safe.');
      setShowError(true);
    }
  };

  const visualizeAudio = () => {
    try {
      if (!canvasRef.current || !analyserRef.current) return;
      
      const canvas = canvasRef.current;
      const canvasContext = canvas.getContext('2d');
      if (!canvasContext) return;
      
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      
      const draw = () => {
        try {
          animationFrameId.current = requestAnimationFrame(draw);
          
          analyser.getByteFrequencyData(dataArray);
          
          canvasContext.fillStyle = 'rgb(40, 44, 52)';
          canvasContext.fillRect(0, 0, WIDTH, HEIGHT);
          
          const barWidth = (WIDTH / bufferLength) * 2.5;
          let barHeight;
          let x = 0;
          
          for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            
            // Create gradient color based on amplitude
            const hue = i / bufferLength * 120 + 240; // Blue to green spectrum
            canvasContext.fillStyle = `hsl(${hue}, 100%, ${50 + barHeight / 4}%)`;
            
            // Draw bar with rounded tops
            canvasContext.beginPath();
            canvasContext.roundRect(
              x, 
              HEIGHT - barHeight, 
              barWidth, 
              barHeight,
              [3, 3, 0, 0] // Round top corners only
            );
            canvasContext.fill();
            
            // Draw a reflection effect
            const gradient = canvasContext.createLinearGradient(0, HEIGHT - barHeight, 0, HEIGHT);
            gradient.addColorStop(0, `hsla(${hue}, 100%, ${50 + barHeight / 4}%, 0.5)`);
            gradient.addColorStop(1, `hsla(${hue}, 100%, ${50 + barHeight / 4}%, 0.1)`);
            
            canvasContext.fillStyle = gradient;
            canvasContext.beginPath();
            canvasContext.roundRect(
              x, 
              HEIGHT - barHeight / 3, 
              barWidth, 
              barHeight / 3,
              [0, 0, 0, 0]
            );
            canvasContext.fill();
            
            x += barWidth + 1;
          }
        } catch (renderError) {
          console.error('Error rendering audio visualization:', renderError);
          // If rendering fails, stop the animation loop to prevent further errors
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = null;
          }
        }
      };
      
      draw();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  };

  const handleUpload = async () => {
    if (!user || (!audioChunks.length && !selectedFile) || !responseTime) return;
    
    try {
      setUploading(true);
      
      // Get current scenario
      const currentScenario = scenarios[currentScenarioIndex];
      
      // Determine the audio source - either from recording or file upload
      let audioBlob: Blob;
      let fileFormat = 'webm';
      
      if (selectedFile) {
        // Use the uploaded file
        audioBlob = selectedFile;
        // Get file extension
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || 'mp3';
        fileFormat = fileExtension;
      } else {
        // Use the recorded audio
        audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        fileFormat = 'webm';
      }
      
      // Create file name and path
      const fileName = `recording-${Date.now()}.${fileFormat}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('applicant-recordings')
        .upload(filePath, audioBlob);
        
      if (uploadError) throw uploadError;
      
      // Save recording information to database
      const { error: dbError } = await supabase
        .from('recordings')
        .insert([
          {
            user_id: user.id,
            scenario_id: currentScenario.id,
            storage_key: filePath,
            response_time: responseTime,
            file_format: fileFormat
          }
        ]);
        
      if (dbError) throw dbError;
      
      // Update user's progress
      const nextIndex = currentScenarioIndex + 1;
      const isComplete = nextIndex >= scenarios.length;
      
      const updateData: any = {
        current_scenario_index: isComplete ? scenarios.length : nextIndex
      };
      
      // If this was the last scenario, mark as completed
      if (isComplete) {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Add this scenario to completed steps
      setCompletedSteps([...completedSteps, currentScenario.id]);
      
      // Stop the question timer
      stopQuestionTimer();
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        
        // Clear recording state
        setAudioChunks([]);
        setAudioURL(null);
        setResponseTime(null);
        setSelectedFile(null);
        
        // If all scenarios are completed, show completion form
        if (isComplete) {
          setShowCompletionForm(true);
        } else {
          // Move to next question
          setCurrentScenarioIndex(nextIndex);
        }
        
        setSubmitted(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading recording:', error);
      setErrorMessage('Failed to save your recording. Please try again.');
      setShowError(true);
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!user || !textResponse.trim()) return;
    
    try {
      setUploading(true);
      
      // Get current scenario
      const currentScenario = scenarios[currentScenarioIndex];
      
      // Calculate response time - use the question timer value
      const calculatedResponseTime = Math.max(1, questionTimer); 
      
      // Save text response to database
      const { error: dbError } = await supabase
        .from('text_responses')
        .insert([
          {
            user_id: user.id,
            scenario_id: currentScenario.id,
            response_text: textResponse.trim(),
            response_time: calculatedResponseTime
          }
        ]);
        
      if (dbError) throw dbError;
      
      // Update user's progress
      const nextIndex = currentScenarioIndex + 1;
      const isComplete = nextIndex >= scenarios.length;
      
      const updateData: any = {
        current_scenario_index: isComplete ? scenarios.length : nextIndex
      };
      
      // If this was the last scenario, mark as completed
      if (isComplete) {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
        
      if (updateError) throw updateError;
      
      // Add this scenario to completed steps
      setCompletedSteps([...completedSteps, currentScenario.id]);
      
      // Stop the question timer
      stopQuestionTimer();
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        
        // Clear text response
        setTextResponse('');
        setResponseTime(null);
        
        // If all scenarios are completed, show completion form
        if (isComplete) {
          setShowCompletionForm(true);
        } else {
          // Move to next question
          setCurrentScenarioIndex(nextIndex);
        }
        
        setSubmitted(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting text response:', error);
      setErrorMessage('Failed to save your response. Please try again.');
      setShowError(true);
    } finally {
      setUploading(false);
    }
  };

  const navigateToScenario = (index: number) => {
    // Only allow navigating to completed scenarios or the current one
    if (index < 0 || index >= scenarios.length) return;
    
    const targetScenarioId = scenarios[index].id;
    const hasCompletedTarget = completedSteps.includes(targetScenarioId);
    
    // If trying to go forward, only allow if the current step is completed
    if (index > currentScenarioIndex) {
      const currentScenarioId = scenarios[currentScenarioIndex].id;
      if (!completedSteps.includes(currentScenarioId)) {
        setErrorMessage('Please complete the current question before moving to the next one.');
        setShowError(true);
        return;
      }
    }
    
    // Reset state when changing scenarios
    setAudioChunks([]);
    setAudioURL(null);
    setIsRecording(false);
    setTextResponse('');
    setSubmitted(false);
    setSelectedFile(null);
    
    // Stop current timer and start a new one for the selected scenario
    stopQuestionTimer();
    
    // Navigate to selected scenario
    setCurrentScenarioIndex(index);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setUploading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          address: formData.country, // Using address field for country
          desired_salary: formData.referredBy // Using desired_salary field for referral information
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving profile information:', error);
      setErrorMessage('Failed to save your information. Please try again.');
      setShowError(true);
    } finally {
      setUploading(false);
    }
  };

  const handlePlayAudio = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      audio.play();
    }
  };
  
  // For file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if file is an audio file
      if (!file.type.startsWith('audio/')) {
        setErrorMessage('Please select an audio file (MP3, WAV, etc.)');
        setShowError(true);
        return;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('File size exceeds 50MB limit');
        setShowError(true);
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioURL(url);
      setResponseTime(30); // Default response time for uploaded files
      
      // Clear recorded audio if any
      setAudioChunks([]);
    }
  };

  const hasCompletedCurrentScenario = () => {
    if (!scenarios.length || currentScenarioIndex >= scenarios.length) return false;
    
    const currentScenarioId = scenarios[currentScenarioIndex].id;
    return completedSteps.includes(currentScenarioId);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (showCompletionForm) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-8">
        <div className="mb-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment Completed!
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Thank you for completing your application. Please provide a few more details so we can contact you about next steps.
          </p>
        </div>
        
        {showSuccess && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>Your information has been saved successfully!</span>
          </div>
        )}
        
        {showError && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => setShowError(false)}
              className="ml-auto text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
            >
              &times;
            </button>
          </div>
        )}
        
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name*
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleFormChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number*
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleFormChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country*
            </label>
            <input
              type="text"
              id="country"
              name="country"
              value={formData.country}
              onChange={handleFormChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          {/* New "Who referred you?" field */}
          <div>
            <label htmlFor="referredBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Who referred you? (if applicable)
            </label>
            <input
              type="text"
              id="referredBy"
              name="referredBy"
              value={formData.referredBy}
              onChange={handleFormChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Name of person who referred you"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>A recruiter will contact you shortly to discuss next steps.</p>
          <p className="mt-2">Thank you for your interest in working with RecoverPro™ Staffing!</p>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to the RecoverPro™ Staffing Assessment
        </h2>
        
        <div className="text-gray-600 dark:text-gray-300 space-y-4 mb-8">
          <p>
            This assessment will evaluate your communication skills for debt collection roles. You'll be presented with common scenarios a debt collector might face.
          </p>
          <p>
            For each scenario, you'll record a short audio response or provide a written response, as if you were speaking directly to the debtor. This helps us evaluate your:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Professional communication skills</li>
            <li>Ability to handle difficult conversations</li>
            <li>Knowledge of compliance requirements</li>
            <li>Problem-solving under pressure</li>
          </ul>
        </div>
        
        {/* Position Type Selection */}
        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4 text-lg">
            Which position are you applying for?
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-600">
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  name="position-type"
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  checked={positionType === 'voice'}
                  onChange={() => setPositionType('voice')}
                />
              </div>
              <div className="ml-3 flex-1">
                <span className="text-gray-900 dark:text-gray-100 font-medium block">Voice Position</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Phone-based collection role with customer interaction</span>
              </div>
            </label>
            
            <label className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-600">
              <div className="flex items-center h-5">
                <input
                  type="radio"
                  name="position-type"
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  checked={positionType === 'non-voice'}
                  onChange={() => setPositionType('non-voice')}
                />
              </div>
              <div className="ml-3 flex-1">
                <span className="text-gray-900 dark:text-gray-100 font-medium block">Non-Voice Position</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Email, chat, and text-based collection role</span>
              </div>
            </label>
          </div>
          
          {showError && (
            <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
            Before you begin:
          </h3>
          <ul className="space-y-2 text-blue-700 dark:text-blue-200">
            <li className="flex items-start">
              <span className="inline-block rounded-full bg-blue-200 dark:bg-blue-700 w-5 h-5 flex items-center justify-center text-blue-700 dark:text-blue-200 mr-2 flex-shrink-0">1</span>
              Ensure your microphone is working properly
            </li>
            <li className="flex items-start">
              <span className="inline-block rounded-full bg-blue-200 dark:bg-blue-700 w-5 h-5 flex items-center justify-center text-blue-700 dark:text-blue-200 mr-2 flex-shrink-0">2</span>
              Find a quiet environment with minimal background noise
            </li>
            <li className="flex items-start">
              <span className="inline-block rounded-full bg-blue-200 dark:bg-blue-700 w-5 h-5 flex items-center justify-center text-blue-700 dark:text-blue-200 mr-2 flex-shrink-0">3</span>
              Your responses will be reviewed by our hiring team
            </li>
            <li className="flex items-start">
              <span className="inline-block rounded-full bg-blue-200 dark:bg-blue-700 w-5 h-5 flex items-center justify-center text-blue-700 dark:text-blue-200 mr-2 flex-shrink-0">4</span>
              The assessment should take about 10-15 minutes to complete
            </li>
          </ul>
        </div>
        
        <button
          onClick={startInterview}
          disabled={!positionType}
          className={`w-full py-3 px-4 rounded-lg shadow-md flex items-center justify-center font-medium transition-colors ${
            positionType 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {!positionType ? 'Please select position type' : 'Begin Assessment'}
          {positionType && <ArrowRight className="w-5 h-5 ml-2" />}
        </button>
        
        {!positionType && (
          <p className="mt-4 text-center text-sm text-red-500 dark:text-red-400">
            Please select a position type to continue
          </p>
        )}
      </div>
    );
  }

  if (scenariosLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading assessment questions...</p>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mt-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Assessment Questions Available
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We're currently updating our assessment. Please check back later or contact support for assistance.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const currentScenario = scenarios[currentScenarioIndex];
  const isLastScenario = currentScenarioIndex === scenarios.length - 1;
  const isAudioResponseType = currentScenario?.response_type === 'audio';
  const currentScenarioId = currentScenario?.id;
  const hasCompletedCurrent = completedSteps.includes(currentScenarioId);
  
  // Determine if the next button should be disabled
  const disableNext = () => {
    // If this is audio response type
    if (isAudioResponseType) {
      // If audio already recorded but not submitted yet
      if (audioURL && !hasCompletedCurrent) {
        return false;
      }
      // If already completed this scenario previously
      if (hasCompletedCurrent) {
        return false;
      }
      // Otherwise disable - need to record and submit first
      return true;
    } else {
      // For text response type
      // If text already entered but not submitted yet
      if (textResponse.trim().length > 0 && !hasCompletedCurrent) {
        return false;
      }
      // If already completed this scenario previously
      if (hasCompletedCurrent) {
        return false;
      }
      // Otherwise disable - need to enter text and submit first
      return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <ProgressBar
          currentStep={currentScenarioIndex + 1}
          totalSteps={scenarios.length}
          completedSteps={completedSteps.length}
          onStepClick={index => {
            // Only allow navigation to completed steps or current step
            const targetScenarioId = scenarios[index].id;
            if (completedSteps.includes(targetScenarioId) || index === currentScenarioIndex) {
              navigateToScenario(index);
            } else {
              setErrorMessage('Please complete the current question before skipping ahead.');
              setShowError(true);
            }
          }}
        />
      </div>
      
      {/* Success/Error messages */}
      {showSuccess && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-4 rounded-lg mb-6 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>Your response has been saved successfully!</span>
        </div>
      )}
      
      {showError && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{errorMessage}</p>
          </div>
          <button
            onClick={() => setShowError(false)}
            className="ml-auto text-red-800 dark:text-red-200 hover:text-red-900 dark:hover:text-red-100"
          >
            &times;
          </button>
        </div>
      )}
      
      {/* Scenario container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
        {/* Scenario header */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 relative">
          {/* Timer display in top right */}
          {!hasCompletedCurrent && (
            <div className="absolute top-4 right-4 flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full shadow-sm border border-blue-200 dark:border-blue-800">
              <Clock className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">{formatTime(questionTimer)}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentScenario?.title}
            </h2>
            <div className="flex items-center">
              {hasCompletedCurrent && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 mr-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Completed
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                {isAudioResponseType ? (
                  <>
                    <Mic className="w-3 h-3 mr-1" />
                    Voice Response
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Text Response
                  </>
                )}
              </span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            {currentScenario?.description}
          </p>
        </div>
        
        {/* Response section */}
        <div className="p-6">
          {isAudioResponseType ? (
            /* Audio response */
            <div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-blue-700 dark:text-blue-200 text-sm">
                  <b>Instructions:</b> Record yourself responding to this scenario as if you were speaking directly to the debtor. Speak clearly and professionally.
                </p>
              </div>
              
              {/* Recording visualization */}
              <div className="mb-6 visualization-container">
                <canvas
                  ref={canvasRef}
                  className={`w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg ${isRecording ? 'border-2 border-blue-500 dark:border-blue-400' : 'border border-gray-300 dark:border-gray-600'}`}
                  width="600"
                  height="128"
                />
                {isRecording && <div className="pulse-effect"></div>}
              </div>
              
              {/* Timer display - show only when recording */}
              {isRecording && (
                <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 py-2 px-4 rounded-lg mb-4 w-full md:w-auto">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-lg font-semibold">{formatTime(elapsedTime)}</span>
                </div>
              )}
              
              {/* Recording controls */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {!isRecording && !audioURL && !selectedFile && (
                  <>
                    <button
                      onClick={startAudioRecording}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
                      disabled={hasCompletedCurrent}
                    >
                      <Mic className="w-5 h-5" />
                      <span>Start Recording</span>
                    </button>
                    
                    {/* File upload option */}
                    <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow cursor-pointer">
                      <Upload className="w-5 h-5" />
                      <span>Upload Audio</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={hasCompletedCurrent}
                      />
                    </label>
                  </>
                )}
                
                {isRecording && (
                  <button
                    onClick={stopAudioRecording}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow"
                  >
                    <Pause className="w-5 h-5" />
                    <span>Stop Recording</span>
                  </button>
                )}
                
                {audioURL && (
                  <>
                    <button
                      onClick={handlePlayAudio}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
                    >
                      <Play className="w-5 h-5" />
                      <span>Play</span>
                    </button>
                    
                    {!hasCompletedCurrent && (
                      <button
                        onClick={handleUpload}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Submit</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    {!hasCompletedCurrent && (
                      <button
                        onClick={() => {
                          setAudioURL(null);
                          setAudioChunks([]);
                          setSelectedFile(null);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow"
                      >
                        <XCircle className="w-5 h-5" />
                        <span>Discard</span>
                      </button>
                    )}
                  </>
                )}
              </div>
              
              {selectedFile && (
                <div className="mt-2 mb-4 text-sm text-gray-600 dark:text-gray-300">
                  <p>Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</p>
                </div>
              )}
              
              {hasCompletedCurrent && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    You've already completed this question.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Text response */
            <div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6">
                <p className="text-blue-700 dark:text-blue-200 text-sm">
                  <b>Instructions:</b> Type your response to this scenario as if you were responding to the debtor. Be professional and clear.
                </p>
              </div>
              
              <div className="mb-6">
                <textarea
                  value={textResponse}
                  onChange={(e) => setTextResponse(e.target.value)}
                  className="w-full h-32 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Type your response here..."
                  disabled={hasCompletedCurrent || uploading}
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {!hasCompletedCurrent && (
                  <button
                    onClick={handleTextSubmit}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
                    disabled={!textResponse.trim() || uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Response</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {hasCompletedCurrent && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-green-800 dark:text-green-200 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    You've already completed this question.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => navigateToScenario(currentScenarioIndex - 1)}
          className={`flex items-center space-x-2 px-4 py-2 ${
            currentScenarioIndex > 0
              ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
          } rounded-lg`}
          disabled={currentScenarioIndex === 0}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>
        
        <button
          onClick={() => {
            // If current scenario not completed and we have audio to submit
            if (!hasCompletedCurrent && audioURL && isAudioResponseType) {
              handleUpload();
              return;
            }
            
            // If current scenario not completed and we have text to submit
            if (!hasCompletedCurrent && textResponse.trim() && !isAudioResponseType) {
              handleTextSubmit();
              return;
            }
            
            // Otherwise just navigate to next scenario if allowed
            navigateToScenario(currentScenarioIndex + 1);
          }}
          className={`flex items-center space-x-2 px-4 py-2 ${
            currentScenarioIndex < scenarios.length - 1 && !disableNext()
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : isLastScenario && !disableNext()
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
          } rounded-lg`}
          disabled={disableNext()}
        >
          <span>{isLastScenario ? 'Finish' : 'Next'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}