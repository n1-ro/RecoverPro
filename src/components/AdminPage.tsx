import React, { useEffect, useState, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Play, Pause, ChevronDown, ChevronUp, Clock, RefreshCw, LayoutGrid, Users, Calendar, CheckCircle, Headphones, MessageSquare, BarChart, Download, Volume2, Star, StarHalf, Edit } from 'lucide-react';
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
  address: string | null;
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
  rating?: ResponseRating;
}

interface TextResponse {
  id: string;
  scenario_id: number;
  response_text: string;
  response_time: number;
  created_at: string;
  title?: string;
  rating?: ResponseRating;
}

interface ResponseRating {
  id: string;
  rating: number;
  feedback?: string;
  rated_by: string;
  created_at: string;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  response_type: string;
}

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseId: string;
  responseType: 'audio' | 'text';
  initialRating?: number;
  initialFeedback?: string;
  onSave: (rating: number, feedback: string) => Promise<void>;
}

const RatingModal: React.FC<RatingModalProps> = ({ 
  isOpen, 
  onClose, 
  responseId, 
  responseType, 
  initialRating = 5, 
  initialFeedback = '',
  onSave 
}) => {
  const [rating, setRating] = useState(initialRating);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset values when modal opens
    if (isOpen) {
      setRating(initialRating);
      setFeedback(initialFeedback);
      setError(null);
    }
  }, [isOpen, initialRating, initialFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await onSave(rating, feedback);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save rating');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Rate {responseType === 'audio' ? 'Voice' : 'Text'} Response
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating (1-10)
            </label>
            <div className="flex items-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`w-8 h-8 rounded-full ${
                    rating >= value 
                      ? 'bg-yellow-400 text-yellow-900' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  } flex items-center justify-center transition-colors`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Needs Improvement</span>
              <span>Excellent</span>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Add any feedback or notes about this response"
            ></textarea>
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm rounded">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  // Rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedResponseForRating, setSelectedResponseForRating] = useState<{
    id: string;
    type: 'audio' | 'text';
    rating?: number;
    feedback?: string;
  } | null>(null);

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
      setDebugInfo("Error fetching scenarios: " + JSON.stringify(error));
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
      
      const filename = parts[parts.length - 1];
      
      // List files in the user's directory
      const { data: files, error } = await supabase.storage
        .from('applicant-recordings')
        .list(userId);

      if (error) {
        console.error('Error listing files:', error);
        setDebugInfo((prev) => `${prev}\nError listing files for ${userId}: ${error.message}`);
        return false;
      }

      // Check if the file exists in the list
      const exists = files !== null && files.some(file => file.name === filename);
      if (!exists) {
        setDebugInfo((prev) => `${prev}\nFile ${filename} not found in directory ${userId}`);
      }
      return exists;
    } catch (error: any) {
      console.error('Error checking file existence:', error);
      setDebugInfo((prev) => `${prev}\nFile existence check error: ${error.message}`);
      return false;
    }
  };

  const fetchApplicants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo("Starting to fetch applicants...");
      
      // First get all scenarios to map ID to title
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scenarios')
        .select('id, title, response_type')
        .order('display_order', { ascending: true });
        
      if (scenariosError) {
        setDebugInfo((prev) => `${prev}\nError fetching scenarios: ${scenariosError.message}`);
        throw scenariosError;
      }
      
      // Create a map of scenario ID to title and response type
      const scenarioMap = new Map();
      scenariosData?.forEach(scenario => {
        scenarioMap.set(scenario.id, {
          title: scenario.title,
          response_type: scenario.response_type
        });
      });
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role_type', 'applicant')
        .order('created_at', { ascending: false });

      if (profilesError) {
        setDebugInfo((prev) => `${prev}\nError fetching profiles: ${profilesError.message}`);
        throw profilesError;
      }

      setDebugInfo((prev) => `${prev}\nFetched ${profiles?.length || 0} applicant profiles`);
      
      let successCount = 0;
      let failCount = 0;
      let debugMessages: string[] = [];

      const applicantsWithRecordings = await Promise.all(
        profiles.map(async (profile) => {
          // Fetch audio recordings
          const { data: recordings, error: recordingsError } = await supabase
            .from('recordings')
            .select('*')
            .eq('user_id', profile.id);

          if (recordingsError) {
            debugMessages.push(`Error fetching recordings for ${profile.email}: ${recordingsError.message}`);
            throw recordingsError;
          }
          
          debugMessages.push(`Found ${recordings?.length || 0} recordings for ${profile.email}`);
          
          // Fetch text responses
          const { data: textResponses, error: textResponsesError } = await supabase
            .from('text_responses')
            .select('*')
            .eq('user_id', profile.id);
            
          if (textResponsesError) {
            debugMessages.push(`Error fetching text responses: ${textResponsesError.message}`);
            throw textResponsesError;
          }

          // Fetch ratings for audio recordings
          const { data: audioRatings, error: audioRatingsError } = await supabase
            .from('response_ratings')
            .select('*')
            .in('recording_id', (recordings || []).map(r => r.id));
            
          if (audioRatingsError) {
            debugMessages.push(`Error fetching audio ratings: ${audioRatingsError.message}`);
          }

          const audioRatingsMap = new Map();
          (audioRatings || []).forEach(rating => {
            audioRatingsMap.set(rating.recording_id, {
              id: rating.id,
              rating: rating.rating,
              feedback: rating.feedback,
              rated_by: rating.rated_by,
              created_at: rating.created_at
            });
          });

          // Fetch ratings for text responses
          const { data: textRatings, error: textRatingsError } = await supabase
            .from('response_ratings')
            .select('*')
            .in('text_response_id', (textResponses || []).map(r => r.id));
            
          if (textRatingsError) {
            debugMessages.push(`Error fetching text ratings: ${textRatingsError.message}`);
          }

          const textRatingsMap = new Map();
          (textRatings || []).forEach(rating => {
            textRatingsMap.set(rating.text_response_id, {
              id: rating.id,
              rating: rating.rating,
              feedback: rating.feedback,
              rated_by: rating.rated_by,
              created_at: rating.created_at
            });
          });

          const recordingsWithUrls = await Promise.all(
            (recordings || []).map(async (recording) => {
              try {
                debugMessages.push(`Processing recording ${recording.id} with storage key: ${recording.storage_key}`);
                
                // Check if file exists before getting signed URL
                const exists = await checkFileExists(recording.storage_key);
                
                if (!exists) {
                  failCount++;
                  debugMessages.push(`File does not exist: ${recording.storage_key}`);
                  return {
                    ...recording,
                    exists: false,
                    title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`,
                    rating: audioRatingsMap.get(recording.id)
                  };
                }

                // Try to get a signed URL with longer expiration (1 hour)
                const { data: urlData, error: urlError } = await supabase.storage
                  .from('applicant-recordings')
                  .createSignedUrl(recording.storage_key, 3600);

                if (urlError) {
                  failCount++;
                  debugMessages.push(`Error creating signed URL for ${recording.storage_key}: ${urlError.message}`);
                  return {
                    ...recording,
                    exists: false,
                    title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`,
                    rating: audioRatingsMap.get(recording.id)
                  };
                }

                if (!urlData || !urlData.signedUrl) {
                  failCount++;
                  debugMessages.push(`No signed URL returned for ${recording.storage_key}`);
                  return {
                    ...recording,
                    exists: false,
                    title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`,
                    rating: audioRatingsMap.get(recording.id)
                  };
                }

                successCount++;
                debugMessages.push(`Successfully got signed URL for ${recording.storage_key}`);
                return {
                  ...recording,
                  url: urlData.signedUrl,
                  exists: true,
                  title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`,
                  rating: audioRatingsMap.get(recording.id)
                };
              } catch (error: any) {
                failCount++;
                debugMessages.push(`Error processing recording: ${error.message}`);
                return {
                  ...recording,
                  exists: false,
                  title: scenarioMap.get(recording.scenario_id)?.title || `Scenario ${recording.scenario_id}`,
                  rating: audioRatingsMap.get(recording.id)
                };
              }
            })
          );
          
          // Add titles and ratings to text responses
          const textResponsesWithTitles = (textResponses || []).map(response => ({
            ...response,
            title: scenarioMap.get(response.scenario_id)?.title || `Scenario ${response.scenario_id}`,
            rating: textRatingsMap.get(response.id)
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

      // Set debug info
      debugMessages.push(`Processed ${successCount + failCount} recordings: ${successCount} successful, ${failCount} failed.`);
      setDebugInfo(debugMessages.join("\n"));

      setApplicants(applicantsWithRecordings);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching applicants:', error);
      setError(`Error loading applicant data: ${error.message}`);
      setDebugInfo((prev) => `${prev}\nError fetching applicant data: ${error.message}`);
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
          setDebugInfo((prev) => `${prev}\nError playing audio: ${error}`);
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

  const openRatingModal = (responseId: string, type: 'audio' | 'text', currentRating?: ResponseRating) => {
    setSelectedResponseForRating({
      id: responseId,
      type,
      rating: currentRating?.rating || 5,
      feedback: currentRating?.feedback || ''
    });
    setIsRatingModalOpen(true);
  };

  const saveRating = async (rating: number, feedback: string) => {
    if (!selectedResponseForRating || !user) return;
    
    try {
      const { id, type } = selectedResponseForRating;
      
      // Check if rating already exists
      const { data: existingRatings } = await supabase
        .from('response_ratings')
        .select('*')
        .eq(type === 'audio' ? 'recording_id' : 'text_response_id', id);
      
      if (existingRatings && existingRatings.length > 0) {
        // Update existing rating
        const { error } = await supabase
          .from('response_ratings')
          .update({
            rating,
            feedback,
            rated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRatings[0].id);
          
        if (error) throw error;
      } else {
        // Create new rating
        const { error } = await supabase
          .from('response_ratings')
          .insert({
            [type === 'audio' ? 'recording_id' : 'text_response_id']: id,
            rating,
            feedback,
            rated_by: user.id
          });
          
        if (error) throw error;
      }
      
      // Update the local state to reflect the new rating
      setApplicants(prevApplicants => {
        return prevApplicants.map(applicant => {
          if (type === 'audio') {
            const updatedRecordings = applicant.recordings.map(recording => {
              if (recording.id === id) {
                return {
                  ...recording,
                  rating: {
                    id: recording.rating?.id || 'temp-id',
                    rating,
                    feedback,
                    rated_by: user.id,
                    created_at: new Date().toISOString()
                  }
                };
              }
              return recording;
            });
            return { ...applicant, recordings: updatedRecordings };
          } else {
            const updatedTextResponses = applicant.text_responses?.map(response => {
              if (response.id === id) {
                return {
                  ...response,
                  rating: {
                    id: response.rating?.id || 'temp-id',
                    rating,
                    feedback,
                    rated_by: user.id,
                    created_at: new Date().toISOString()
                  }
                };
              }
              return response;
            }) || [];
            return { ...applicant, text_responses: updatedTextResponses };
          }
        });
      });
      
    } catch (error: any) {
      console.error('Error saving rating:', error);
      throw new Error(`Failed to save rating: ${error.message}`);
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

  // Render stars for ratings
  const renderRatingStars = (rating?: ResponseRating) => {
    if (!rating) return null;
    
    const starCount = rating.rating || 0;
    const fullStars = Math.floor(starCount / 2);
    const hasHalfStar = (starCount % 2) !== 0;
    
    return (
      <div className="flex items-center gap-1 text-yellow-400">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-current" />
        ))}
        {hasHalfStar && <StarHalf className="w-4 h-4 fill-current" />}
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">{starCount}/10</span>
      </div>
    );
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

      {/* Debug info in dev environment */}
      {debugInfo && (
        <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg text-yellow-800 dark:text-yellow-200 text-xs">
          <details>
            <summary className="cursor-pointer">Debug Information</summary>
            <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-64">{debugInfo}</pre>
          </details>
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
                        {applicant.email}
                        {applicant.full_name && (
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            ({applicant.full_name})
                          </span>
                        )}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
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
                        {applicant.phone_number && (
                          <div>
                            Phone: {applicant.phone_number}
                          </div>
                        )}
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
                                  <div className="grid grid-cols-1 gap-4">
                                    {applicant.recordings.map((recording) => (
                                      <div
                                        key={recording.id}
                                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                      >
                                        {recording.exists ? (
                                          <div>
                                            <div className="flex justify-between items-start mb-3">
                                              <h4 className="font-medium text-gray-900 dark:text-white">
                                                <Headphones className="w-4 h-4 inline-block mr-1 text-blue-500" />
                                                {recording.title}
                                              </h4>
                                              <div className="flex items-center">
                                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center mr-3">
                                                  <Clock className="w-3 h-3 mr-1" />
                                                  {formatTime(recording.response_time || 0)}
                                                </span>
                                                <button 
                                                  onClick={() => openRatingModal(recording.id, 'audio', recording.rating)}
                                                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                  title={recording.rating ? "Edit rating" : "Rate this response"}
                                                >
                                                  <Edit className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                            
                                            {/* Rating display */}
                                            {recording.rating && (
                                              <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md p-2">
                                                <div className="flex justify-between items-center">
                                                  <div className="flex items-center">
                                                    {renderRatingStars(recording.rating)}
                                                  </div>
                                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    Rated {formatTimeAgo(recording.rating.created_at)}
                                                  </span>
                                                </div>
                                                {recording.rating.feedback && (
                                                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                                    <p className="italic">"{recording.rating.feedback}"</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}

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
                                                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                                  <div 
                                                    className="h-full bg-blue-500 rounded-full transition-all duration-300" 
                                                    style={{ width: `${(audioProgress[recording.id] || 0) * 100}%` }}
                                                  ></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                  <span>
                                                    {currentlyPlaying === recording.id 
                                                      ? formatTime((audioRef.current?.currentTime || 0))
                                                      : '0:00'
                                                    }
                                                  </span>
                                                  <span>
                                                    {formatTime(audioDuration[recording.id] || 0)}
                                                  </span>
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => downloadAudio(recording.url, `recording-${recording.id}.webm`)}
                                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                title="Download recording"
                                              >
                                                <Download className="w-4 h-4" />
                                              </button>
                                            </div>
                                            
                                            {/* Audio visualization */}
                                            {currentlyPlaying === recording.id && (
                                              <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mt-3 visualization-container">
                                                <div className="h-full w-full flex items-center justify-around">
                                                  {Array.from({ length: 30 }).map((_, i) => (
                                                    <div
                                                      key={i}
                                                      className="w-1.5 rounded-full bg-blue-500 audio-bar"
                                                      style={{
                                                        animationDelay: `${i * 0.05}s`
                                                      }}
                                                    ></div>
                                                  ))}
                                                </div>
                                                <div className="pulse-effect"></div>
                                              </div>
                                            )}
                                            
                                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                                              Path: {recording.storage_key}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col">
                                            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                                              <span>{recording.title}</span>
                                              <span className="text-sm">Recording unavailable</span>
                                            </div>
                                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                              Path: {recording.storage_key}
                                            </div>
                                            
                                            {/* Still show rating for unavailable recordings */}
                                            {recording.rating && (
                                              <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md p-2">
                                                <div className="flex justify-between items-center">
                                                  <div className="flex items-center">
                                                    {renderRatingStars(recording.rating)}
                                                  </div>
                                                  <button 
                                                    onClick={() => openRatingModal(recording.id, 'audio', recording.rating)}
                                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                    title="Edit rating"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                                {recording.rating.feedback && (
                                                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                                    <p className="italic">"{recording.rating.feedback}"</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
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
                                        <div className="flex justify-between items-start mb-3">
                                          <h4 className="font-medium text-gray-900 dark:text-white flex items-center">
                                            <MessageSquare className="w-3 h-3 mr-1 text-blue-500" />
                                            {response.title}
                                          </h4>
                                          <div className="flex items-center">
                                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center mr-3">
                                              <Clock className="w-4 h-4 mr-1" />
                                              Response Time: {formatTime(response.response_time || 0)}
                                            </div>
                                            <button 
                                              onClick={() => openRatingModal(response.id, 'text', response.rating)}
                                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                              title={response.rating ? "Edit rating" : "Rate this response"}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                        
                                        {/* Rating display */}
                                        {response.rating && (
                                          <div className="mb-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md p-2">
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center">
                                                {renderRatingStars(response.rating)}
                                              </div>
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Rated {formatTimeAgo(response.rating.created_at)}
                                              </span>
                                            </div>
                                            {response.rating.feedback && (
                                              <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                                <p className="italic">"{response.rating.feedback}"</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
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

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        responseId={selectedResponseForRating?.id || ''}
        responseType={selectedResponseForRating?.type || 'audio'}
        initialRating={selectedResponseForRating?.rating || 5}
        initialFeedback={selectedResponseForRating?.feedback || ''}
        onSave={saveRating}
      />
    </div>
  );
}