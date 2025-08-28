import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Play, Pause, ChevronDown, ChevronUp, Clock, RefreshCw, LayoutGrid, Users, Calendar, CheckCircle, Headphones, MessageSquare, BarChart, Download, Volume2, Mail, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ApplicantChart } from '../components/ApplicantChart';
import { ScenarioManager } from '../components/ScenarioManager';
import { ScenarioResponsesPanel } from '../components/ScenarioResponsesPanel';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

interface Applicant {
  id: string;
  email: string;
  created_at: string;
  recordings: Recording[];
  text_responses?: TextResponse[];
  attempts: number;
  average_response_time: number;
  interview_started_at: string | null;
  completed_at: string | null;
  full_name: string | null;
  phone_number: string | null;
}

interface Recording {
  id: string;
  scenario_id: number;
  storage_key: string;
  response_time: number;
  created_at: string;
  url?: string;
  title?: string;
  exists?: boolean;
}

interface TextResponse {
  id: string;
  scenario_id: number;
  response_text: string;
  response_time: number;
  created_at: string;
  title?: string;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  response_type: string;
}

export function AdminPage() {
  const { user, loading } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [expandedApplicant, setExpandedApplicant] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'applicants' | 'scenarios' | 'responses'>('applicants');
  const [activeResponseTab, setActiveResponseTab] = useState<'voice' | 'text'>('voice');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<{[key: string]: number}>({});
  const [audioDuration, setAudioDuration] = useState<{[key: string]: number}>({});
  const [audioVolume, setAudioVolume] = useState(0.8);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      const isSpecialAdmin = 
        user.email === 'tellitlikeitisjoe@gmail.com' || 
        user.email === 'thejoeycagle@gmail.com' || 
        (user.email && user.email.endsWith('@admin.com'));

      if (isSpecialAdmin) {
        setIsAdmin(true);
        fetchApplicants();
        fetchScenarios();
      } else {
        // Check from profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role_type')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          navigate('/dashboard', { replace: true });
        } else if (profile && profile.role_type === 'admin') {
          setIsAdmin(true);
          fetchApplicants();
          fetchScenarios();
        } else {
          // Not an admin, redirect to dashboard
          navigate('/dashboard', { replace: true });
        }
      }

      setIsLoading(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  // Set up audio event listeners
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const updateProgress = () => {
        if (currentlyPlaying && audio.duration) {
          setAudioProgress(prev => ({
            ...prev,
            [currentlyPlaying]: audio.currentTime / audio.duration
          }));
        }
      };
      
      const updateDuration = () => {
        if (currentlyPlaying) {
          setAudioDuration(prev => ({
            ...prev,
            [currentlyPlaying]: audio.duration
          }));
        }
      };
      
      const handleEnded = () => {
        setCurrentlyPlaying(null);
      };
      
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentlyPlaying]);

  const fetchScenarios = async () => {
    try {
      setScenariosLoading(true);
      const { data, error } = await supabase
        .from('scenarios')
        .select('id, title, description, response_type')
        .order('display_order', { ascending: true });
        
      if (error) throw error;
      setScenarios(data || []);
    } catch (err) {
      console.error('Error fetching scenarios:', err);
    } finally {
      setScenariosLoading(false);
    }
  };

  const checkFileExists = async (storage_key: string): Promise<boolean> => {
    try {
      // Extract user ID and filename from storage key
      const parts = storage_key.split('/');
      const userId = parts[0];
      
      if (parts.length < 2) {
        console.error('Invalid storage key format:', storage_key);
        return false;
      }
      
      try {
        // List files in the user's directory
        const { data: files, error } = await supabase.storage
          .from('applicant-recordings')
          .list(userId);

        if (error) {
          console.error('Error listing files:', error);
          return false;
        }

        // Check if the file exists in the list
        return files !== null && files.some(file => file.name === filename);
      } catch (error) {
        console.error('Error checking file existence:', error);
        return false;
      }
    } catch (error) {
      console.error('Error parsing storage key:', error);
      return false;
    }
  };

  const fetchApplicants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First get all scenarios to map ID to title
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('id, title, response_type')
        .order('display_order', { ascending: true });
        
      if (scenariosError) throw scenariosError;
      
      // Create a map of scenario ID to title and response type
      const scenarioMap = new Map();
      scenariosData?.forEach(scenario => {
        scenarioMap.set(scenario.id, {
          title: scenario.title,
          response_type: scenario.response_type
        });
      });
      
      // Get applicant profiles with needed fields
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at, attempts, interview_started_at, completed_at, full_name, phone_number')
        .eq('role_type', 'applicant')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const applicantsWithRecordings = await Promise.all(
        profiles.map(async (profile) => {
          // Fetch audio recordings
          const { data: recordings, error: recordingsError } = await supabase
            .from('recordings')
            .select('*')
            .eq('user_id', profile.id);

          if (recordingsError) {
            console.error('Error fetching recordings:', recordingsError);
            return {
              ...profile,
              recordings: [],
              text_responses: [],
              average_response_time: 0
            };
          }
          
          // Fetch text responses
          const { data: textResponses, error: textResponsesError } = await supabase
            .from('text_responses')
            .select('*')
            .eq('user_id', profile.id);
            
          if (textResponsesError) {
            console.error('Error fetching text responses:', textResponsesError);
            return {
              ...profile,
              recordings: recordings || [],
              text_responses: [],
              average_response_time: 0
            };
          }

          // Process recordings - handle errors gracefully
          const recordingsWithUrls = await Promise.all(
            (recordings || []).map(async (recording) => {
              try {
                // Check if file exists before getting signed URL
                let exists = false;
                try {
                  exists = await checkFileExists(recording.storage_key);
                } catch (error) {
                  console.error('File check failed:', error);
                  exists = false;
                }
                
                if (!exists) {
                  return {
                    ...recording,
                    exists: false,
                    title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`
                  };
                }

                try {
                  const { data: urlData, error: urlError } = await supabase.storage
                    .from('applicant-recordings')
                    .createSignedUrl(recording.storage_key, 3600);

                  if (urlError) {
                    console.error('Error creating signed URL:', urlError);
                    return {
                      ...recording,
                      exists: false,
                      title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`
                    };
                  }

                  return {
                    ...recording,
                    url: urlData?.signedUrl,
                    exists: true,
                    title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`
                  };
                } catch (error) {
                  console.error('Error getting signed URL:', error);
                  return {
                    ...recording,
                    exists: false,
                    title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`
                  };
                }
              } catch (error) {
                console.error('Error processing recording:', error);
                return {
                  ...recording,
                  exists: false,
                  title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`
                };
              }
            })
          );
          
          // Add titles to text responses
          const textResponsesWithTitles = (textResponses || []).map(response => ({
            ...response,
            title: scenarioMap.get(response.scenario_id)?.title || `Scenario ${response.scenario_id}`
          }));
          
          // Calculate average response time from both recordings and text responses
          const allResponseTimes = [
            ...(recordings || []).map(r => r.response_time || 0),
            ...(textResponses || []).map(t => t.response_time || 0)
          ].filter(time => time > 0);
          
          const avgResponseTime = allResponseTimes.length > 0
            ? allResponseTimes.reduce((acc, time) => acc + time, 0) / allResponseTimes.length
            : 0;

          return {
            ...profile,
            recordings: recordingsWithUrls,
            text_responses: textResponsesWithTitles,
            attempts: profile.attempts || 1,
            average_response_time: avgResponseTime,
            interview_started_at: profile.interview_started_at,
            completed_at: profile.completed_at
          };
        })
      );

      setApplicants(applicantsWithRecordings);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching applicants:', error);
      setError('Error loading applicant data. Please try again.');
      setIsLoading(false);
    }
  };

  const handlePlayPause = async (recordingId: string, url?: string) => {
    if (!url) return;

    if (currentlyPlaying === recordingId && audioRef.current) {
      audioRef.current.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        if (currentlyPlaying) {
          // Stop current playback if another recording is playing
          audioRef.current.pause();
        }
        audioRef.current.src = url;
        audioRef.current.volume = audioVolume;
        try {
          await audioRef.current.play();
          setCurrentlyPlaying(recordingId);
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>, recordingId: string) => {
    const seekPosition = parseFloat(e.target.value);
    if (audioRef.current && currentlyPlaying === recordingId) {
      const seekTime = audioDuration[recordingId] * seekPosition;
      audioRef.current.currentTime = seekTime;
      setAudioProgress(prev => ({
        ...prev,
        [recordingId]: seekPosition
      }));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setAudioVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const downloadAudio = async (url?: string, filename?: string) => {
    if (!url) return;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to download audio file');
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'recording.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading audio:', error);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === null || seconds === undefined) {
      return '0:00';
    }
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Not started';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };
  
  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return '';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Signed in as: {user.email} (Admin)
          </div>
          <button
            onClick={() => {
              fetchApplicants();
              fetchScenarios();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Daily Applicants Chart */}
      {activeTab !== 'responses' && <ApplicantChart />}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('applicants')}
          className={`py-3 px-4 inline-flex items-center border-b-2 font-medium text-sm ${
            activeTab === 'applicants'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Applicants
        </button>
        <button
          onClick={() => setActiveTab('responses')}
          className={`py-3 px-4 inline-flex items-center border-b-2 font-medium text-sm ${
            activeTab === 'responses'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Headphones className="w-4 h-4 mr-2" />
          View Responses by Question
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`py-3 px-4 inline-flex items-center border-b-2 font-medium text-sm ${
            activeTab === 'scenarios'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          Manage Questions
        </button>
      </div>

      {/* Volume control - visible in the applicants tab */}
      {activeTab === 'applicants' && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg mb-6 flex items-center">
          <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-300 mr-2" />
          <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Volume:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioVolume}
            onChange={handleVolumeChange}
            className="w-36 h-2 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer"
          />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
            {Math.round(audioVolume * 100)}%
          </span>
        </div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && <ScenarioManager />}

      {/* Responses Tab */}
      {activeTab === 'responses' && (
        <ScenarioResponsesPanel onBack={() => setActiveTab('applicants')} />
      )}

      {/* Applicants Tab */}
      {activeTab === 'applicants' && (
        <>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center mb-6">
            <Users className="w-6 h-6 mr-2" />
            Applicant Responses
            <span className="ml-3 text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-2 py-0.5 rounded-full">
              {applicants.length} {applicants.length === 1 ? 'Applicant' : 'Applicants'}
            </span>
          </h2>

          <audio 
            ref={audioRef} 
            onEnded={() => setCurrentlyPlaying(null)} 
            className="hidden" 
          />

          <div className="space-y-4">
            {applicants.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-300">No applicants found.</p>
              </div>
            ) : (
              applicants.map((applicant) => (
                <div
                  key={applicant.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                >
                  <div
                    className={`flex items-center justify-between p-6 cursor-pointer ${
                      applicant.completed_at ? 'border-l-4 border-green-500' : 
                      applicant.interview_started_at ? 'border-l-4 border-yellow-500' :
                      ''
                    }`}
                    onClick={() => setExpandedApplicant(
                      expandedApplicant === applicant.id ? null : applicant.id
                    )}
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {applicant.full_name || applicant.email}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          <span className="font-medium">{applicant.email}</span>
                        </div>
                        {applicant.phone_number && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            <span className="font-medium">{applicant.phone_number}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Avg Response: {formatTime(applicant.average_response_time)}
                        </div>
                        <div>
                          Attempts: {applicant.attempts}
                        </div>
                        <div>
                          Applied: {formatDateTime(applicant.created_at)} ({formatTimeAgo(applicant.created_at)})
                        </div>
                      </div>
                      
                      {/* Assessment timeline information */}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center text-blue-600 dark:text-blue-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          Started: {applicant.interview_started_at ? formatDateTime(applicant.interview_started_at) : 'Not started'}
                        </div>
                        
                        {applicant.completed_at && (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completed: {formatDateTime(applicant.completed_at)}
                          </div>
                        )}
                        
                        {applicant.interview_started_at && !applicant.completed_at && (
                          <div className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                            In Progress
                          </div>
                        )}
                      </div>
                    </div>
                    {expandedApplicant === applicant.id ? 
                      <ChevronUp className="w-6 h-6 text-gray-400" /> : 
                      <ChevronDown className="w-6 h-6 text-gray-400" />
                    }
                  </div>

                  {expandedApplicant === applicant.id && (
                    <div className="px-6 pb-6">
                      <div className="space-y-4">
                        {applicant.recordings.length === 0 && (!applicant.text_responses || applicant.text_responses.length === 0) ? (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                            No responses submitted yet.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {/* Response type tabs */}
                            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => setActiveResponseTab('voice')}
                                className={`py-2 px-4 border-b-2 font-medium flex items-center ${
                                  activeResponseTab === 'voice'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                <Headphones className="w-4 h-4 mr-2" />
                                Voice Responses ({applicant.recordings.length})
                              </button>
                              <button
                                onClick={() => setActiveResponseTab('text')}
                                className={`py-2 px-4 border-b-2 font-medium flex items-center ${
                                  activeResponseTab === 'text'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Text Responses ({applicant.text_responses?.length || 0})
                              </button>
                            </div>

                            {/* Voice responses */}
                            {activeResponseTab === 'voice' && (
                              <div>
                                {applicant.recordings.length === 0 ? (
                                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No voice responses submitted yet.
                                  </p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {applicant.recordings.map((recording) => (
                                      <div
                                        key={recording.id}
                                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                      >
                                        {recording.exists && recording.url ? (
                                          <div className="flex items-center space-x-4">
                                            <button
                                              onClick={() => handlePlayPause(recording.id, recording.url)}
                                              className={`flex-shrink-0 p-3 rounded-full transition-colors ${
                                                currentlyPlaying === recording.id 
                                                  ? 'bg-red-500 text-white hover:bg-red-600' 
                                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                                              }`}
                                            >
                                              {currentlyPlaying === recording.id ? 
                                                <Pause className="w-4 h-4" /> : 
                                                <Play className="w-4 h-4" />
                                              }
                                            </button>
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                  <Headphones className="w-3 h-3 inline-block mr-1 text-blue-500" />
                                                  {recording.title}
                                                </h4>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center ml-2">
                                                  <Clock className="w-3 h-3 mr-1" />
                                                  {formatTime(recording.response_time || 0)}
                                                </span>
                                              </div>
                                              {currentlyPlaying === recording.id && (
                                                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mt-2">
                                                  <div 
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                                                    style={{ width: `${(audioProgress[recording.id] || 0) * 100}%` }}
                                                  ></div>
                                                </div>
                                              )}
                                            </div>
                                            <button
                                              onClick={() => downloadAudio(recording.url, `recording-${recording.id}.mp3`)}
                                              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                              title="Download recording"
                                            >
                                              <Download className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center">
                                              <AlertCircle className="w-4 h-4 mr-2 text-amber-500" />
                                              <span>{recording.title || "Recording"}</span>
                                            </div>
                                            <span className="text-sm">Recording unavailable</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Text responses */}
                            {activeResponseTab === 'text' && (
                              <div>
                                {!applicant.text_responses || applicant.text_responses.length === 0 ? (
                                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                    No text responses submitted yet.
                                  </p>
                                ) : (
                                  <div className="space-y-4">
                                    {applicant.text_responses.map((response) => (
                                      <div
                                        key={response.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                      >
                                        <div className="flex justify-between mb-2">
                                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                                            <MessageSquare className="w-3 h-3 mr-1 text-blue-500" />
                                            {response.title}
                                          </h4>
                                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            Response Time: {formatTime(response.response_time || 0)}
                                          </div>
                                        </div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                                          Submitted: {formatDateTime(response.created_at)}
                                        </div>
                                        <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                                            {response.response_text}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}