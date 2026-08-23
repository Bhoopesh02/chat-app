import React, { useState } from 'react';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';
import '../styles/poll.css';

const CreatePollModal = ({ onClose, onSendPoll }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const handleAddOption = () => {
    if (options.length < 12) {
      setOptions([...options, { id: Date.now().toString(), text: '' }]);
    }
  };

  const handleRemoveOption = (indexToRemove) => {
    if (options.length > 2) {
      setOptions(options.filter((_, index) => index !== indexToRemove));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    // Filter out empty options
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    
    if (question.trim() === '' || validOptions.length < 2) {
      alert('Please enter a question and at least 2 options.');
      return;
    }

    const pollData = {
      question: question.trim(),
      options: validOptions.map(opt => ({
        id: opt.id,
        text: opt.text.trim(),
        votes: {}
      })),
      allowMultiple
    };

    onSendPoll({ type: 'poll', pollData });
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // For Firefox compatibility
    e.dataTransfer.setData("text/html", e.target.parentNode);
    e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
  };

  const handleDragOver = (index) => {
    if (draggedItemIndex === null) return;
    if (draggedItemIndex === index) return;

    const newOptions = [...options];
    const draggedItem = newOptions[draggedItemIndex];
    
    // Remove the item from original position
    newOptions.splice(draggedItemIndex, 1);
    // Insert at new position
    newOptions.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setOptions(newOptions);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>Create Poll</h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Ask a question</label>
            <input 
              type="text" 
              placeholder="Type your question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              style={{ padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)', width: '100%' }}
            />
          </div>

          <div className="create-poll-options-list">
            <label>Options</label>
            {options.map((opt, index) => (
              <div 
                key={opt.id} 
                className="create-poll-option"
                onDragOver={(e) => { e.preventDefault(); handleDragOver(index); }}
              >
                <div 
                  className="drag-handle" 
                  draggable 
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <GripVertical size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder={`Option ${index + 1}`}
                  value={opt.text}
                  maxLength={100}
                  onChange={(e) => handleOptionChange(index, e.target.value.slice(0, 100))}
                />
                {options.length > 2 && (
                  <button 
                    className="btn-icon" 
                    onClick={() => handleRemoveOption(index)}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 12 && (
            <button 
              onClick={handleAddOption}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--primary-color)', 
                background: 'transparent', 
                border: 'none', 
                fontWeight: '500', 
                cursor: 'pointer',
                marginBottom: '1.5rem'
              }}
            >
              <Plus size={18} /> Add another option
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="checkbox" 
              id="allowMultiple" 
              checked={allowMultiple}
              onChange={(e) => setAllowMultiple(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem' }}
            />
            <label htmlFor="allowMultiple" style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>
              Allow multiple answers
            </label>
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleCreate}>Create</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePollModal;
