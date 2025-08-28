import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Info, UserRound, Clock, Calendar, ArrowLeft, ArrowUpDown, CheckCircle, XCircle, Headphones, AlertCircle, Music, Volume2, Download, MessageSquare, Star, StarHalf, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';

interface ScenarioResponsesPanelProps {
  onBack: () => void;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  response_type: 'audio' | 'text';
  display_order: number;
}

interface ResponseRating {
  id: string;
  rating: number;
  feedback?: string;
  rated_by: string;
  created_at: string;
}

interface AudioResponse {
  id: string;
  user_id: string;
  scenario_id: number;
  response_time?: number;
  created_at: string;
  user_email: string;
  storage_key: string;
  url?: string;
  exists?: boolean;
  rating?: ResponseRating;
}

interface TextResponse {
  id: string;
  user_id: string;
  scenario_id: number;
  response_time?: number;
  created_at: string;
  user_email: string;
  response_text: string;
  rating?: ResponseRating;
}

type Response = AudioResponse | TextResponse;

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

export function ScenarioResponsesPanel({ onBack }: ScenarioResponsesPanelProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'fastest' | 'slowest' | 'highest' | 'lowest'>('newest');
  const [audioProgress, setAudioProgress] = useState<{[key: string]: number}>({});
  const [audioDuration, setAudioDuration] = useState<{[key: string]: number}>({});
  const [audioVolume, setAudioVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedResponseForRating, setSelectedResponseForRating] = useState<{
    id: string;
    type: 'audio' | 'text';
    rating?: number;
    feedback?: string;
  } | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  useEffect(() => {
    if (selectedScenario) {
      fetchResponses(selectedScenario.id);
    }
  }, [selectedScenario, sortOrder]);

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
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setScenarios(data);
        setSelectedScenario(data[0]); // Select first scenario by default
      } else {
        setScenarios([]);
      }
    } catch (err) {
      console.error('Error fetching scenarios:', err);
      setError('Failed to load interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkFileExists = async (storage_key: string): Promise<boolean> => {
    try {
      // Extract user ID and filename from storage key
      const parts = storage_key.split('/');
      if (parts.length < 2) {
        console.error('Invalid storage key format:', storage_key);
        return false;
      }
      
      const userId = parts[0];
      
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
        return files !== null && files.some(file => file.name === parts[parts.length - 1]);
      } catch (error) {
        console.error('Error checking file existence:', error);
        return false;
      }
    } catch (error) {
      console.error('Error parsing storage key:', error);
      return false;
    }
  };

  const fetchResponses = async (scenarioId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const isAudioType = selectedScenario?.response_type === 'audio';
      
      // Include a direct join with profiles instead of relying on the nested select
      if (isAudioType) {
        // For audio responses
        const { data, error } = await supabase
          .from('recordings')
          .select(`
            id,
            user_id,
            scenario_id,
            storage_key,
            response_time,
            created_at,
            file_format,
            profiles!left(email)
          `)
          .eq('scenario_id', scenarioId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setResponses([]);
          setLoading(false);
          return;
        }

        // Format the audio responses
        const formattedResponses = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          scenario_id: item.scenario_id,
          response_time: item.response_time,
          created_at: item.created_at,
          storage_key: item.storage_key,
          file_format: item.file_format,
          user_email: item.profiles?.email || 'Unknown User'
        }));

        // Fetch ratings for responses
        const { data: ratings, error: ratingsError } = await supabase
          .from('response_ratings')
          .select('*')
          .in('recording_id', formattedResponses.map(r => r.id));

        if (ratingsError) {
          console.error('Error fetching ratings:', ratingsError);
        }

        // Create a map of ratings by response ID
        const ratingsMap = new Map();
        if (ratings) {
          ratings.forEach(rating => {
            ratingsMap.set(rating.recording_id, {
              id: rating.id,
              rating: rating.rating,
              feedback: rating.feedback,
              rated_by: rating.rated_by,
              created_at: rating.created_at
            });
          });
        }

        // Add ratings to responses
        const responsesWithRatings = formattedResponses.map(response => ({
          ...response,
          rating: ratingsMap.get(response.id)
        }));

        // Sort responses
        let sortedResponses = [...responsesWithRatings];
        switch (sortOrder) {
          case 'newest':
            sortedResponses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
          case 'oldest':
            sortedResponses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
          case 'fastest':
            sortedResponses.sort((a, b) => (a.response_time || 9999) - (b.response_time || 9999));
            break;
          case 'slowest':
            sortedResponses.sort((a, b) => (b.response_time || 0) - (a.response_time || 0));
            break;
          case 'highest':
            sortedResponses.sort((a, b) => (b.rating?.rating || 0) - (a.rating?.rating || 0));
            break;
          case 'lowest':
            sortedResponses.sort((a, b) => (a.rating?.rating || 10) - (b.rating?.rating || 10));
            break;
        }

        // Check existence and get signed URLs
        let debugMessages = [];
        let successCount = 0;
        let failCount = 0;
        
        const responsesWithUrls = await Promise.all(
          sortedResponses.map(async (response) => {
            try {
              debugMessages.push(`Processing storage key: ${response.storage_key}`);
              
              // Check if file exists before getting signed URL
              let exists = false;
              try {
                exists = await checkFileExists(response.storage_key);
              } catch (error) {
                console.error('File check failed:', error);
                exists = false;
              }
              
              if (!exists) {
                debugMessages.push(`File does not exist: ${response.storage_key}`);
                failCount++;
                return {
                  ...response,
                  exists: false
                };
              }

              try {
                // Get the file path making sure to escape any special characters
                const filePath = response.storage_key;
                
                // Try to generate a signed URL with a longer expiry time (3600 seconds = 1 hour)
                const { data: urlData, error: urlError } = await supabase.storage
                  .from('applicant-recordings')
                  .createSignedUrl(filePath, 3600);

                if (urlError) {
                  debugMessages.push(`Error creating signed URL for ${filePath}: ${urlError.message}`);
                  failCount++;
                  return {
                    ...response,
                    exists: false
                  };
                }

                if (!urlData || !urlData.signedUrl) {
                  debugMessages.push(`No signed URL returned for ${filePath}`);
                  failCount++;
                  return {
                    ...response,
                    exists: false
                  };
                }
                
                successCount++;
                debugMessages.push(`Successfully got signed URL for ${filePath}`);
                
                return {
                  ...response,
                  url: urlData.signedUrl,
                  exists: true
                };
              } catch (error: any) {
                debugMessages.push(`Error creating signed URL: ${error.message}`);
                failCount++;
                return {
                  ...response,
                  exists: false
                };
              }
            } catch (err: any) {
              debugMessages.push(`Error processing audio response: ${err.message}`);
              failCount++;
              return {
                ...response,
                exists: false
              };
            }
          })
        );
        
        // Set debug info
        setDebugInfo(`Processed ${successCount + failCount} recordings: ${successCount} successful, ${failCount} failed.\n\n${debugMessages.join('\n')}`);
        
        setResponses(responsesWithUrls);
      } else {
        // For text responses
        const { data, error } = await supabase
          .from('text_responses')
          .select(`
            id,
            user_id,
            scenario_id,
            response_text,
            response_time,
            created_at,
            profiles!left(email)
          `)
          .eq('scenario_id', scenarioId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setResponses([]);
          setLoading(false);
          return;
        }

        // Format the text responses
        const formattedResponses = data.map(item => ({
          id: item.id,
          user_id: item.user_id,
          scenario_id: item.scenario_id,
          response_time: item.response_time,
          created_at: item.created_at,
          response_text: item.response_text,
          user_email: item.profiles?.email || 'Unknown User'
        }));

        // Fetch ratings for text responses
        const { data: ratings, error: ratingsError } = await supabase
          .from('response_ratings')
          .select('*')
          .in('text_response_id', formattedResponses.map(r => r.id));
          
        if (ratingsError) {
          console.error('Error fetching ratings:', ratingsError);
        }
        
        // Create a map of ratings by response ID
        const ratingsMap = new Map();
        if (ratings) {
          ratings.forEach(rating => {
            ratingsMap.set(rating.text_response_id, {
              id: rating.id,
              rating: rating.rating,
              feedback: rating.feedback,
              rated_by: rating.rated_by,
              created_at: rating.created_at
            });
          });
        }
        
        // Add ratings to responses
        const responsesWithRatings = formattedResponses.map(response => ({
          ...response,
          rating: ratingsMap.get(response.id)
        }));

        // Sort responses
        let sortedResponses = [...responsesWithRatings];
        switch (sortOrder) {
          case 'newest':
            sortedResponses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            break;
          case 'oldest':
            sortedResponses.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            break;
          case 'fastest':
            sortedResponses.sort((a, b) => (a.response_time || 9999) - (b.response_time || 9999));
            break;
          case 'slowest':
            sortedResponses.sort((a, b) => (b.response_time || 0) - (a.response_time || 0));
            break;
          case 'highest':
            sortedResponses.sort((a, b) => (b.rating?.rating || 0) - (a.rating?.rating || 0));
            break;
          case 'lowest':
            sortedResponses.sort((a, b) => (a.rating?.rating || 10) - (b.rating?.rating || 10));
            break;
        }
        
        setResponses(sortedResponses);
      }
    } catch (err: any) {
      console.error('Error fetching responses:', err);
      setError(`Failed to load responses: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async (responseId: string, url?: string) => {
    if (!url) return;

    if (currentlyPlaying === responseId && audioRef.current) {
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
          setCurrentlyPlaying(responseId);
        } catch (error) {
          console.error('Error playing audio:', error);
        }
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setAudioVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>, responseId: string) => {
    const seekPosition = parseFloat(e.target.value);
    if (audioRef.current && currentlyPlaying === responseId) {
      const seekTime = audioDuration[responseId] * seekPosition;
      audioRef.current.currentTime = seekTime;
      setAudioProgress(prev => ({
        ...prev,
        [responseId]: seekPosition
      }));
    }
  };

  const saveRating = async (rating: number, feedback: string) => {
    if (!selectedResponseForRating) return;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

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
      setResponses(prevResponses => {
        return prevResponses.map(response => {
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
        });
      });
      
    } catch (error: any) {
      console.error('Error saving rating:', error);
      throw new Error(`Failed to save rating: ${error.message}`);
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

  const formatTime = (seconds?: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const isAudioResponse = (response: Response): response is AudioResponse => {
    return 'storage_key' in response;
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

  if (loading && scenarios.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading scenarios...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Sort by:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="fastest">Fastest Response</option>
            <option value="slowest">Slowest Response</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>
      
      {/* Error message if any */}
      {error && (
        <div className="m-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
      
      {/* Debug info in dev environment - can be removed in production */}
      {debugInfo && (
        <div className="mx-6 mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg text-yellow-800 dark:text-yellow-200 text-xs">
          <details>
            <summary className="cursor-pointer">Debug Information</summary>
            <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-64">{debugInfo}</pre>
          </details>
        </div>
      )}
      
      {/* Volume control */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center">
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
      
      {/* Scenario tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 pb-0">
        <div className="flex overflow-x-auto py-2 no-scrollbar">
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario)}
              className={`px-4 py-2 rounded-t-lg mr-2 min-w-max whitespace-nowrap flex items-center ${
                selectedScenario?.id === scenario.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {scenario.response_type === 'audio' ? (
                <Headphones className="w-4 h-4 mr-2" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              {scenario.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* Selected scenario details */}
      {selectedScenario && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {selectedScenario.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            {selectedScenario.description}
          </p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            {selectedScenario.response_type === 'audio' ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 mr-2">
                <Headphones className="w-3 h-3 mr-1" />
                Audio Response
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 mr-2">
                <MessageSquare className="w-3 h-3 mr-1" />
                Text Response
              </span>
            )}
            <span>Question #{Math.round(selectedScenario.display_order / 10)}</span>
          </div>
        </div>
      )}
      
      {/* Audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setCurrentlyPlaying(null)} 
        className="hidden" 
      />
      
      {/* Responses list */}
      <div className="p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
          {loading ? 'Loading responses...' : (
            <>
              <span>
                {responses.length} {responses.length === 1 ? 'Response' : 'Responses'} for "{selectedScenario?.title}"
              </span>
              {responses.length > 0 && selectedScenario?.response_type === 'audio' && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  (Click the play button to listen)
                </span>
              )}
            </>
          )}
        </h4>
        
        {loading && selectedScenario ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            {selectedScenario?.response_type === 'audio' ? (
              <Headphones className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            ) : (
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            )}
            <p className="text-lg">No responses found for this question.</p>
            <p className="text-sm mt-2">Check other questions or wait for applicants to submit their responses.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {responses.map(response => (
              <div 
                key={response.id}
                className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600 transition-all hover:shadow-lg"
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-3">
                        <UserRound className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-lg font-medium text-gray-900 dark:text-white">
                          {response.user_email}
                        </h5>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          Response Time: {formatTime(response.response_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400 mr-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDateTime(response.created_at)}
                        </div>
                      </div>
                      <button 
                        onClick={() => openRatingModal(response.id, isAudioResponse(response) ? 'audio' : 'text', response.rating)}
                        className="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title={response.rating ? "Edit rating" : "Rate this response"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Rating display */}
                  {response.rating && (
                    <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {renderRatingStars(response.rating)}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(response.rating.created_at)}
                        </span>
                      </div>
                      {response.rating.feedback && (
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p className="italic">"{response.rating.feedback}"</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isAudioResponse(response) ? (
                    <div className="mt-4">
                      {response.exists && response.url ? (
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                          {/* Audio controls */}
                          <div className="flex items-center mb-2">
                            <button
                              onClick={() => handlePlayPause(response.id, response.url)}
                              className={`flex items-center justify-center p-3 rounded-full transition-colors ${
                                currentlyPlaying === response.id 
                                  ? 'bg-red-500 text-white hover:bg-red-600' 
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                              title={currentlyPlaying === response.id ? "Pause" : "Play"}
                            >
                              {currentlyPlaying === response.id ? (
                                <Pause className="w-5 h-5" />
                              ) : (
                                <Play className="w-5 h-5" />
                              )}
                            </button>
                            
                            <div className="flex-grow mx-4">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.001"
                                value={audioProgress[response.id] || 0}
                                onChange={(e) => handleSeek(e, response.id)}
                                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                                  currentlyPlaying === response.id
                                    ? 'bg-gradient-to-r from-blue-300 to-blue-500 dark:from-blue-700 dark:to-blue-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                                disabled={currentlyPlaying !== response.id}
                              />
                              
                              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span>
                                  {currentlyPlaying === response.id 
                                    ? formatTime(audioRef.current?.currentTime || 0)
                                    : '0:00'
                                  }
                                </span>
                                <span>
                                  {formatTime(audioDuration[response.id] || 0)}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => downloadAudio(response.url, `recording-${response.id}.webm`)}
                              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                              title="Download recording"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {/* Audio visualization */}
                          {currentlyPlaying === response.id && (
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
                              {currentlyPlaying === response.id && <div className="pulse-effect"></div>}
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Storage path: {response.storage_key}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-gray-500 dark:text-gray-400 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Audio recording is no longer available
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Storage key: {response.storage_key}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : 'response_text' in response ? (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {response.response_text || "No text content available."}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                      <p className="text-red-700 dark:text-red-300 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Response data is incomplete or corrupted.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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