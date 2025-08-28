import React, { useState, useEffect } from 'react';
import { Pencil, Trash, Plus, CheckCircle, XCircle, ArrowUp, ArrowDown, MessageSquare, Mic, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { supabase } from '../lib/supabase';

interface Scenario {
  id: number;
  title: string;
  description: string;
  active: boolean;
  response_type?: 'audio' | 'text';
  display_order?: number;
  created_at?: string;
}

export function ScenarioManager() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [schemaReady, setSchemaReady] = useState<boolean>(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [responseType, setResponseType] = useState<'audio' | 'text'>('audio');

  // Check if the new schema is ready
  useEffect(() => {
    const checkSchema = async () => {
      try {
        // Check if display_order column exists
        const { data: displayOrderData, error: displayOrderError } = await supabase
          .from('scenarios')
          .select('display_order')
          .limit(1);
          
        // Check if text_responses table exists
        const { data: textResponsesData, error: textResponsesError } = await supabase
          .from('text_responses')
          .select('id')
          .limit(1);
          
        // If both queries didn't throw an error about missing columns/tables,
        // we consider the schema ready
        setSchemaReady(!displayOrderError && !textResponsesError);
      } catch (err) {
        console.log('Schema check error:', err);
        setSchemaReady(false);
      }
    };
    
    checkSchema();
  }, []);

  // Load scenarios
  useEffect(() => {
    fetchScenarios();
  }, [schemaReady]);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('scenarios')
        .select('*');
        
      // Only order by display_order if the schema has been updated
      if (schemaReady) {
        query = query.order('display_order', { ascending: true });
      } else {
        // Fallback to ordering by id
        query = query.order('id', { ascending: true });
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      setScenarios(data || []);
    } catch (err) {
      console.error('Error fetching scenarios:', err);
      setError('Failed to load interview questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startCreating = () => {
    setCreating(true);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setActive(true);
    setResponseType('audio');
    setError(null);
  };

  const startEditing = (scenario: Scenario) => {
    setCreating(false);
    setEditingId(scenario.id);
    setTitle(scenario.title);
    setDescription(scenario.description);
    setActive(scenario.active);
    setResponseType(scenario.response_type || 'audio');
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreating(false);
    setError(null);
  };

  const saveScenario = async () => {
    try {
      setError(null);
      
      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      
      if (!description.trim()) {
        setError('Description is required');
        return;
      }

      if (!schemaReady && responseType === 'text') {
        setError('Text responses are not available until the database schema is updated');
        return;
      }

      let updateData: any = {
        title: title.trim(),
        description: description.trim(),
        active
      };
      
      if (schemaReady) {
        updateData.response_type = responseType;
      }

      if (creating) {
        if (schemaReady) {
          // Find the highest display_order to place new question at the end
          const highestOrder = scenarios.reduce(
            (max, scenario) => Math.max(max, scenario.display_order || 0),
            0
          );
          updateData.display_order = highestOrder + 10; // Add some gap for future reordering
        }
        
        // Create new scenario
        const { data, error } = await supabase
          .from('scenarios')
          .insert(updateData)
          .select();
          
        if (error) throw error;
        
        setScenarios([...scenarios, data[0]]);
        setSuccess('Interview question added successfully!');
      } else if (editingId !== null) {
        // Update existing scenario
        const { data, error } = await supabase
          .from('scenarios')
          .update(updateData)
          .eq('id', editingId)
          .select();
          
        if (error) throw error;
        
        setScenarios(scenarios.map(s => s.id === editingId ? data[0] : s));
        setSuccess('Interview question updated successfully!');
      }
      
      setEditingId(null);
      setCreating(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error saving scenario:', err);
      setError('Failed to save the interview question. Please try again.');
    }
  };

  const deleteScenario = async (id: number) => {
    if (!confirm('Are you sure you want to delete this interview question? This cannot be undone.')) {
      return;
    }
    
    try {
      setError(null);
      
      const { error } = await supabase
        .from('scenarios')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setScenarios(scenarios.filter(s => s.id !== id));
      setSuccess('Interview question deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting scenario:', err);
      setError('Failed to delete the interview question. It may be referenced by existing recordings.');
    }
  };

  const toggleActive = async (scenario: Scenario) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('scenarios')
        .update({ active: !scenario.active })
        .eq('id', scenario.id)
        .select();
        
      if (error) throw error;
      
      setScenarios(scenarios.map(s => s.id === scenario.id ? data[0] : s));
    } catch (err) {
      console.error('Error toggling scenario active state:', err);
      setError('Failed to update the interview question status.');
    }
  };

  const moveScenario = async (index: number, direction: 'up' | 'down') => {
    if (!schemaReady) {
      setError('Reordering questions requires a database schema update');
      return;
    }
    
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === scenarios.length - 1)) {
      return; // Can't move further
    }
    
    try {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const currentScenario = scenarios[index];
      const targetScenario = scenarios[newIndex];
      
      // Swap display orders
      const currentOrder = currentScenario.display_order;
      const targetOrder = targetScenario.display_order;
      
      // Update the first scenario
      const { error: error1 } = await supabase
        .from('scenarios')
        .update({ display_order: -1 }) // Temporary value to avoid unique constraint
        .eq('id', currentScenario.id);
        
      if (error1) throw error1;
      
      // Update the second scenario
      const { error: error2 } = await supabase
        .from('scenarios')
        .update({ display_order: currentOrder })
        .eq('id', targetScenario.id);
        
      if (error2) throw error2;
      
      // Update the first scenario with the final value
      const { error: error3 } = await supabase
        .from('scenarios')
        .update({ display_order: targetOrder })
        .eq('id', currentScenario.id);
        
      if (error3) throw error3;
      
      // Update local state
      const newScenarios = [...scenarios];
      newScenarios[index] = { ...newScenarios[index], display_order: targetOrder };
      newScenarios[newIndex] = { ...newScenarios[newIndex], display_order: currentOrder };
      newScenarios.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      setScenarios(newScenarios);
    } catch (err) {
      console.error('Error reordering scenarios:', err);
      setError('Failed to reorder questions. Please try again.');
      // Refresh to ensure state is consistent
      fetchScenarios();
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!schemaReady) {
      setError('Reordering questions requires a database schema update');
      return;
    }
    
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) {
      return; // No change needed
    }
    
    try {
      // Create a copy for manipulation
      const reorderedScenarios = [...scenarios];
      const [movedItem] = reorderedScenarios.splice(sourceIndex, 1);
      reorderedScenarios.splice(destinationIndex, 0, movedItem);
      
      // Reassign display orders (use increments of 10 to leave space)
      const updatePromises = reorderedScenarios.map((scenario, index) => {
        const newOrder = (index + 1) * 10;
        return supabase
          .from('scenarios')
          .update({ display_order: newOrder })
          .eq('id', scenario.id);
      });
      
      // Execute all updates
      await Promise.all(updatePromises);
      
      // Update local state with new orders
      const updatedScenarios = reorderedScenarios.map((scenario, index) => ({
        ...scenario,
        display_order: (index + 1) * 10
      }));
      
      setScenarios(updatedScenarios);
    } catch (err) {
      console.error('Error updating scenario order:', err);
      setError('Failed to update question order. Please try again.');
      fetchScenarios(); // Refresh to ensure state is consistent
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
      {!schemaReady && (
        <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
              Database Schema Update Required
            </h3>
          </div>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <p>The database schema needs to be updated to support text responses and question reordering.</p>
            <p className="mt-1">Administrator instructions:</p>
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li>Go to the Supabase dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy the SQL migration from <code>supabase/migrations/20250415222145_add_question_type_and_ordering.sql</code></li>
              <li>Run the SQL script in the Supabase SQL Editor</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Interview Questions
        </h2>
        <button
          onClick={startCreating}
          className="flex items-center space-x-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded-lg">
          {success}
        </div>
      )}

      {/* Create/Edit Form */}
      {(creating || editingId !== null) && (
        <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            {creating ? 'Add New Question' : 'Edit Question'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., I'm going through hard times"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Respond professionally to a debtor claiming financial hardship"
              />
            </div>
            
            {schemaReady && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Type
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="responseType"
                      value="audio"
                      checked={responseType === 'audio'}
                      onChange={() => setResponseType('audio')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 flex items-center text-gray-700 dark:text-gray-300">
                      <Mic className="w-4 h-4 mr-1" />
                      Audio Response
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="responseType"
                      value="text"
                      checked={responseType === 'text'}
                      onChange={() => setResponseType('text')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 flex items-center text-gray-700 dark:text-gray-300">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Text Response
                    </span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex items-center">
              <input
                id="active"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Active (visible to applicants)
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveScenario}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios List */}
      {scenarios.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No interview questions found. Click "Add Question" to create one.
        </div>
      ) : (
        schemaReady && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 text-sm">
            <p>Drag and drop questions to change their order, or use the up/down arrows.</p>
          </div>
        )
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="scenarios">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {scenarios.map((scenario, index) => (
                <Draggable 
                  key={scenario.id.toString()} 
                  draggableId={scenario.id.toString()} 
                  index={index}
                  isDragDisabled={!schemaReady}
                >
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`border dark:border-gray-700 rounded-lg p-4 ${
                        !scenario.active ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex items-center justify-center w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 mr-2">
                              {index + 1}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {scenario.title}
                            </h3>
                            {scenario.active ? (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Active
                              </span>
                            ) : (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                Inactive
                              </span>
                            )}
                            {schemaReady && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {scenario.response_type === 'text' ? (
                                  <><MessageSquare className="w-3 h-3 mr-1" /> Text</>
                                ) : (
                                  <><Mic className="w-3 h-3 mr-1" /> Audio</>
                                )}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {scenario.description}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-4">
                          {schemaReady && (
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => moveScenario(index, 'up')}
                                disabled={index === 0}
                                className={`p-1 rounded ${
                                  index === 0
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                title="Move Up"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveScenario(index, 'down')}
                                disabled={index === scenarios.length - 1}
                                className={`p-1 rounded ${
                                  index === scenarios.length - 1
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                title="Move Down"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => toggleActive(scenario)}
                              className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title={scenario.active ? "Set Inactive" : "Set Active"}
                            >
                              {scenario.active ? (
                                <XCircle className="w-5 h-5 text-red-500 hover:text-red-600" />
                              ) : (
                                <CheckCircle className="w-5 h-5 text-green-500 hover:text-green-600" />
                              )}
                            </button>
                            <button
                              onClick={() => startEditing(scenario)}
                              className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Edit Question"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteScenario(scenario.id)}
                              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Delete Question"
                            >
                              <Trash className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}